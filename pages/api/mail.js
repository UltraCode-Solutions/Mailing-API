import nodemailer from "nodemailer";
import { IncomingForm } from "formidable";
import fs from "fs/promises";
import cors from "cors";

export const config = {
   api: {
      bodyParser: false,
   },
};

export default async function handler(req, res) {
   if (req.method === "POST") {
      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
         if (err) {
            return res.status(500).json({ error: "Error parsing form data" });
         }

         const { sender, subject, message, goals, name, lastName, company, country } = fields;

         if (!sender) {
            return res.status(400).json({ error: "Email is required" });
         }

         const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
         const date = new Date().toLocaleString("en-GB", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
         });

         const newMail = {
            sender,
            subject,
            message,
            goals,
            name,
            lastName,
            company,
            country,
            ip,
            date,
         };

         // Send mail using Nodemailer
         const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
               user: process.env.MAIL_SENDER,
               pass: process.env.MAIL_PASS,
            },
         });

         const file = files.file;

         if (file) {
            // Ensure the file path is valid
            if (file[0].filepath) {
               const fileContent = await fs.readFile(file[0].filepath);
               let mimetype = file[0].mimetype;
               if (
                  mimetype ==
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
               ) {
                  mimetype = "docx";
               } else if (mimetype == "application/pdf") {
                  mimetype = "pdf";
               } else if (mimetype == "application/msword") {
                  mimetype = "doc";
               }

               const mailOptions = {
                  from: process.env.MAIL_SENDER,
                  to: process.env.MAIL_TARGET,
                  subject: subject,
                  html: `
                     <h1 style="color: #000000;">New Message from <span style="color: #3366cc;">${newMail.sender}</span></h1>
                     <p style="color: #000000;">${newMail.message}</p>
                     <ul>
                        <li style="color: #000000;">Name: ${newMail.name}</li>
                        <li style="color: #000000;">Last Name: ${newMail.lastName}</li>
                        <li style="color: #000000;">Company: ${newMail.company}</li>
                        <li style="color: #000000;">Country: ${newMail.country}</li>
                        <li style="color: #000000;">Goals: ${newMail.goals}</li>
                        <li style="color: #000000;">Date: ${newMail.date}</li>
                        <li style="color: #000000;">IP: ${newMail.ip}</li>
                     </ul>
                  `,
                  attachments: [
                     {
                        filename: `resume.${mimetype}`,
                        content: fileContent,
                     },
                  ],
               };

               try {
                  await transporter.sendMail(mailOptions);
                  res.status(201).json({ message: "Mail sent successfully" });
               } catch (error) {
                  res.status(500).json({ error: "Failed to send mail" });
               }
            } else {
               return res.status(500).json({ error: "Invalid file path" });
            }
         } else {
            const mailOptions = {
               from: process.env.MAIL_SENDER,
               to: process.env.MAIL_TARGET,
               subject: subject,
               html: `
                  <h1 style="color: #000000;">New Message from <span style="color: #3366cc;">${newMail.sender}</span></h1>
                  <p style="color: #000000;">${newMail.message}</p>
                  <ul>
                     <li style="color: #000000;">Name: ${newMail.name}</li>
                     <li style="color: #000000;">Last Name: ${newMail.lastName}</li>
                     <li style="color: #000000;">Company: ${newMail.company}</li>
                     <li style="color: #000000;">Country: ${newMail.country}</li>
                     <li style="color: #000000;">Goals: ${newMail.goals}</li>
                     <li style="color: #000000;">Date: ${newMail.date}</li>
                     <li style="color: #000000;">IP: ${newMail.ip}</li>
                  </ul>
               `,
            };

            try {
               await transporter.sendMail(mailOptions);
               res.status(201).json({ message: "Mail sent successfully" });
            } catch (error) {
               res.status(500).json({ error: "Failed to send mail" });
            }
         }
      });
   }
}
