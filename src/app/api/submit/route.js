import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { OpenAI } from "openai";
import nodemailer from "nodemailer";
import os from "os";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
    await writeFile(filePath, buffer);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Step 1: Whisper transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });

    const transcript = transcription.text;

    // Step 2: Send to GPT
    const prompt = `This was an idea spoken at night:\n"${transcript}"\n\nCan you summarize it, analyze its feasibility, check for similar existing ideas, and create an action plan to execute it? Be concise but structured.`;

    const gptRes = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    const summary = gptRes.choices[0].message.content;
    console.log("GPT Summary:", summary);

    // Step 3: Generate PDF using Puppeteer
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 2rem;
              line-height: 1.6;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 16px;
            }
            pre {
              background-color: #f5f5f5;
              padding: 1rem;
              border-radius: 5px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <h1>Your Nighttime Idea Summary</h1>
          <pre>${summary}</pre>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Step 4: Email PDF
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO, // hardcoded for now
      subject: "Your Nighttime Idea - Summary and Plan",
      text: "Attached is your AI-generated summary and plan.",
      attachments: [{ filename: "idea-summary.pdf", content: pdfBuffer }],
    });

    // Cleanup
    await unlink(filePath);

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Error in /api/submit:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
