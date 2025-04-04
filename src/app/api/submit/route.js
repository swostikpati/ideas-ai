import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { OpenAI } from "openai";
import nodemailer from "nodemailer";
import os from "os";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import supabase from "@/lib/supabaseClient";
import { generatePdfHtml } from "@/lib/templates/pdfTemplate";
import { auth } from "@clerk/nextjs/server";
// ✅ Correct
import { clerkClient } from "@clerk/express";

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
    const prompt = `This was an idea spoken at night:\n"${transcript}"\n\nCan you summarize it, analyze its feasibility, check for similar existing ideas, and create an action plan to execute it? Be concise but structured.`;

    const gptRes = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    const summary = gptRes.choices[0].message.content;
    console.log("🧠 GPT Summary generated.");

    // Then instead of inline HTML:

    const html = generatePdfHtml(summary);
    // // Step 3: Generate PDF
    // const html = `
    //   <html>
    //     <body>
    //       <h1>Your Nighttime Idea Summary</h1>
    //       <pre>${summary}</pre>
    //     </body>
    //   </html>
    // `;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

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
        name: "Midnight Idea",
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
      subject: "Your Nighttime Idea - Summary and Plan",
      text: "Attached is your AI-generated summary and plan.",
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
