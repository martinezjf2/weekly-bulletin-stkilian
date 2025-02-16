const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const mjml = require("mjml");
const { exec } = require("child_process")

// const nodemailer = require("nodemailer");

async function scrapeData() {
  try {
    const url = "https://www.stkilian.com/bulletins"; // Replace with the actual website
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    // Date and Time
    let date = $(".bulletinName a.name").first().text().trim();
    let link = $(".bulletinName a.name").first().attr("href");
    let picture = $(".bulletinName a.name picture source")
      .first()
      .attr("srcset");
    let img = $(".bulletinName a.name picture img").first().attr("src");

    // console.log({ date });
    // console.log({ link });
    // console.log({ picture });
    // console.log({ img });

    let obj = { date, link, picture, img };

    return obj;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function updateMjmlEmail() {
    const scrapedData = await scrapeData();
    
    let mjmlTemplate = fs.readFileSync("index.mjml", "utf-8");
  console.log(scrapedData.date);

  const email = `
    <mj-section background-color='white' padding='40px 20px' border-radius='8px'>
        <mj-column>
            <mj-text font-size='22px' font-weight='bold' color='#333' align='center'>📢 Stay Updated! View Our Latest Weekly Bulletin</mj-text>
            <mj-text font-size='18px' color='#555' align='center'>🗓 ${scrapedData.date}</mj-text>
            <mj-divider border-color='#ddd' width='60%'></mj-divider>
            <mj-image src='${scrapedData.picture}' width='400px' border-radius='8px' target='_blank' href='${scrapedData.link}'></mj-image>
            <mj-button href='${scrapedData.link}' target='_blank' font-size='18px' font-weight='bold' background-color='#007bff' color='white' border-radius='6px' padding='12px 24px' align='center'>📖 Read Now</mj-button>
        </mj-column>
    </mj-section>
    `;

    mjmlTemplate = mjmlTemplate.replace("{{BULLETIN}}", email)

    fs.writeFileSync("output.mjml", mjmlTemplate, "utf-8")
    console.log('Generated MJML email saved as output.mjml');

    // Convert MJML to HTML
    const emailHtml = mjml(mjmlTemplate).html;
    fs.writeFileSync("new-bulletin.html", emailHtml, "utf8");

    console.log('Generated HTML email saved as output.html');
    
    
  commitAndPushChanges();
}

function commitAndPushChanges() {
  console.log("🚀 Running Git commands...");

  const commitMessage = `Auto-update MJML & HTML files on ${new Date().toISOString()}`;

  exec(
    `git add . && git commit -m "${commitMessage}" && git push origin main`,
    (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Git command failed:", error.message);
        return;
      }
      if (stderr) {
        console.error("⚠️ Git warning:", stderr);
      }
      console.log("✅ Git push successful:", stdout);
    }
  );
}


updateMjmlEmail();

// Add a border on the image of the bulletin and add a title tag for the email bar
// Added a github automatic push as the background using pm2,
// make sure to have ssh installed in github as a key, and clone as ssh for macbook