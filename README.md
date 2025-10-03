<<<<<<< Website to open and see >>>>>>>
# [http-mangeshrautarchive.github.io-](https://mangeshraut712.github.io/mangeshrautarchive/)

README.md

Mangesh Raut Portfolio Website
Welcome to the source code for Mangesh Raut's Portfolio Website. This project showcases my professional journey, skills, projects, and contact information in a clean and responsive design.

Features

Responsive Design: Fully responsive layout for all devices (desktop, tablet, and mobile).
Smooth Navigation: Includes a toggleable menu with smooth scrolling to sections.
Visitor Counter: Tracks unique visitors using localStorage and sessionStorage.
Contact Form: Functional contact form for users to send messages.
Modern UI: Built with Tailwind CSS and Font Awesome for a clean and modern look.
Projects Section: Highlights key projects with descriptions and tags.
Skills & Experience: Displays technical skills, work experience, and education details.
Social Links: Easy access to LinkedIn, GitHub, YouTube, and other platforms.
AI Chatbot AssistMe: Interactive chatbot with voice controls, answering questions about Mangesh and general knowledge.

Technologies Used

HTML5: Semantic and accessible markup.
CSS3: Custom styles with Tailwind CSS for responsiveness.
JavaScript: Interactive features like menu toggling, smooth scrolling, visitor counter, and AssistMe AI chatbot.
Font Awesome: Icons for social links and navigation.
Firebase (Optional): Used for visitor tracking (can be disabled).
Wikipedia API: For general knowledge queries in the chatbot.
Firebase (Optional): Used for visitor tracking (can be disabled).

Chatbot Features
The AssistMe chatbot includes:
- Voice synthesis with enable/disable toggle and stop button
- Portfolio knowledge base with answers about Mangesh's skills and experience
- General knowledge from Wikipedia API
- Responsive chat interface with animations

Project Structure
.
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Custom CSS styles
├── js/
│   └── script.js       # JavaScript for interactivity and AssistMe chatbot
├── images/             # Images used in the project
│   ├── profile.jpg     # Profile picture
│   ├── profile icon.png # Logo icon
│   └── X_logo.jpg      # X (Twitter) logo
└── files/
    └── Mangesh_Raut_Resume.pdf # Resume download

Setup Instructions
Clone the Repository:
git clone https://github.com/<your-username>/<repository-name>.git
cd <repository-name>

Open in Browser: Open index.html in your browser to view the website. No server setup required - fully client-side.

Optional Firebase Setup:

If you want to enable Firebase visitor tracking, update the Firebase configuration in the <script> section of index.html:
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

Replace the placeholders with your Firebase project details.

Usage

Navigation

Click the menu button (☰) to open the overlay menu.
Use the close button (×) to close the menu.
Smooth scrolling is enabled for all navigation links.

Visitor Counter

The visitor counter increments only for unique visitors using localStorage and sessionStorage.

Contact Form

Fill out the form to send a message. The form currently logs data to the console or Firebase (if configured).

Customization

Update Profile Information

Modify the content in the index.html file under the respective sections:
About Me: Update the text in the #about section.
Skills: Add or remove skills in the #skills section.
Projects: Update project details in the #projects section.

Change Images

Replace the images in the images folder with your own. Ensure the file names match or update the paths in index.html.

Update Resume

Replace the Mangesh_Raut_Resume.pdf file in the files folder with your own resume.

Contributing
Contributions are welcome! If you have suggestions or improvements, feel free to fork the repository and submit a pull request.

License
This project is licensed under the MIT License.

Contact
If you have any questions or feedback, feel free to reach out:

Email: mbr63drexel@gmail.com
LinkedIn: linkedin.com/in/mangeshraut71298
GitHub: github.com/mangeshraut
Enjoy exploring the portfolio! 😊
