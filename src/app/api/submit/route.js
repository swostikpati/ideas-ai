export const maxDuration = 40; // to prevent the vercel function from timing out before

import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { OpenAI } from "openai";
import nodemailer from "nodemailer";
import os from "os";
import path from "path";
import fs from "fs";
// import puppeteerdev from "puppeteer";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import supabase from "@/lib/supabaseClient";
import { generatePdfHtml } from "@/lib/templates/pdfTemplate";
import { auth } from "@clerk/nextjs/server";
// ✅ Correct
import { clerkClient } from "@clerk/express";
import detailedIdeaPrompt from "@/lib/prompts/gptPrompt";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    // console.log("❌ Unauthorized access attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("audio");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("✅ Audio buffer size:", buffer.length);

    const timestamp = Date.now();
    const audioFilename = `audio-${timestamp}.webm`;
    const audioPath = `recordings/${audioFilename}`;
    const pdfPath = `summaries/idea-${timestamp}.pdf`;
    const filePath = path.join(os.tmpdir(), audioFilename);

    await writeFile(filePath, buffer);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Step 1: Transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    const transcript = transcription.text;

    // Step 2: GPT Summary
    // const prompt = `This was an idea spoken at night:\n"${transcript}"\n\nCan you summarize it, analyze its feasibility, check for similar existing ideas, and create an action plan to execute it? Be concise but structured.`;
    const prompt = detailedIdeaPrompt(transcript);

    const gptRes = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });
    let rawContent = gptRes.choices[0].message.content.trim();

    // Extract title and content
    const [firstLine, ...rest] = rawContent.split("\n");
    const title = firstLine
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .slice(0, 50);
    const content = rest.join("\n").trim();

    console.log("📄 Extracted Title:", title);
    // const summary = gptRes.choices[0].message.content;
    // let gptContent;
    // try {
    //   let raw = gptRes.choices[0].message.content.trim();

    //   // Remove markdown code fences (e.g., ```json ... ```)
    //   if (raw.startsWith("```json") || raw.startsWith("```")) {
    //     raw = raw.replace(/```json|```/g, "").trim();
    //   }
    //   gptContent = JSON.parse(gptRes.choices[0].message.content);
    // } catch (err) {
    //   console.error("❌ Failed to parse GPT response as JSON:", err);
    //   return NextResponse.json(
    //     { error: "Invalid GPT response format" },
    //     { status: 500 }
    //   );
    // }

    // const { title, content } = gptContent;

    console.log("🧠 GPT Summary generated.");

    // Then instead of inline HTML:

    const html = generatePdfHtml(title, content);
    // // Step 3: Generate PDF
    // const html = `
    //   <html>
    //     <body>
    //       <h1>Your Nighttime Idea Summary</h1>
    //       <pre>${summary}</pre>
    //     </body>
    //   </html>
    // `;

    const isDev = process.env.NODE_ENV !== "production";

    let browser;

    if (isDev) {
      const puppeteerdev = (await import("puppeteer")).default;
      browser = await puppeteerdev.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } else {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    console.log("✅ PDF buffer size:", pdfBuffer.length);

    // Step 4: Upload to Supabase Storage
    const { error: audioUploadError } = await supabase.storage
      .from("idea-assets")
      .upload(audioPath, buffer, {
        contentType: "audio/webm",
        upsert: true,
      });

    if (audioUploadError) {
      console.error("❌ Audio upload failed:", audioUploadError.message);
      throw new Error("Audio upload failed");
    }

    const { error: pdfUploadError } = await supabase.storage
      .from("idea-assets")
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (pdfUploadError) {
      console.error("❌ PDF upload failed:", pdfUploadError.message);
      throw new Error("PDF upload failed");
    }

    const { data: audioUrlData } = supabase.storage
      .from("idea-assets")
      .getPublicUrl(audioPath);

    const { data: pdfUrlData } = supabase.storage
      .from("idea-assets")
      .getPublicUrl(pdfPath);

    const audioUrl = audioUrlData.publicUrl;
    const pdfUrl = pdfUrlData.publicUrl;

    // Step 5: User check / insert
    // const userId = "00000000-0000-0000-0000-000000000000";
    // const email = "test@idea.ai";

    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses[0].emailAddress;

    let existingUser = null;

    try {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      existingUser = data;
    } catch (err) {
      console.warn("User not found. Will insert.");
    }

    if (!existingUser) {
      const { error: insertUserErr } = await supabase
        .from("users")
        .insert([{ id: userId, email }]);

      if (insertUserErr) {
        console.error("User insert error:", insertUserErr.message);
      } else {
        console.log("✅ New user inserted.");
      }
    }

    // let existingUser = null;

    // try {
    //   const { data } = await supabase
    //     .from("users")
    //     .select("id")
    //     .eq("id", userId)
    //     .single();

    //   existingUser = data;
    // } catch (err) {
    //   console.warn("User not found. Will insert.");
    // }

    // if (!existingUser) {
    //   const { error: insertUserErr } = await supabase
    //     .from("users")
    //     .insert([{ id: userId, email }]);

    //   if (insertUserErr) {
    //     console.error("User insert error:", insertUserErr.message);
    //   } else {
    //     console.log("✅ New user inserted.");
    //   }
    // }

    // Step 6: Insert idea record
    const { error: insertIdeaErr } = await supabase.from("ideas").insert([
      {
        user_id: userId,
        name: title || "Midnight Idea",
        audio_url: audioUrl,
        pdf_url: pdfUrl,
      },
    ]);

    if (insertIdeaErr) {
      console.error("❌ Idea insert error:", insertIdeaErr.message);
    } else {
      console.log("✅ Idea inserted in DB.");
    }

    // Step 7: Email summary PDF
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Ready to Build - ${title}`,
      text: `You've taken the first step—your idea has been heard, processed, and brought to life. 
      Attached is a detailed breakdown of your idea: from core concept and competitor analysis to technical feasibility and funding possibilities.
      Take your time reading through it. And when you're ready... let's build it together!`,
      attachments: [{ filename: "idea-summary.pdf", content: pdfBuffer }],
    });

    // Step 8: Cleanup tmp file
    await unlink(filePath);

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("❌ Error in /api/submit:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}
