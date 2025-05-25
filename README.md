# Holy Quran Web Player and Reader

A simple, fast, responsive, and modest single-page web application for listening to Quran recitations.

## Features

*   **Reciter Selection:** Choose from multiple available reciters (Qaris).
*   **Surah Selection:** Select any of the 114 Surahs.
*   **Audio Playback:** Listen to the selected Surah with standard audio controls (play/pause, progress, volume).
*   **Readable Holy Quran:** View the text of the selected Surah in 8 different Rewayat (Arabic) or an English translation (PDF).
*   **Juz (Ajzaa) Reading:** Access the Quran divided into 30 Juz (parts) for convenient reading and study, with each Juz displayed as a continuous text.
*   **PDF Viewer:** Includes a built-in PDF viewer (using PDF.js) for the English translation, featuring page navigation, zooming, and a table of contents.
*   **Language Toggle:** Switch the interface between English and Arabic.
*   **Responsive Design:** Adapts to different screen sizes (desktop, tablet, mobile).
*   **Modest & Minimal:** Clean interface focused on the core functionality.

## Project Goals

*   Provide easy and quick access to the Hoyl Quran audio and text.
*   Offer a clear selection mechanism for reciters and Surahs.
*   Support English and Arabic interfaces.
*   Prioritize performance and responsiveness.
*   Maintain a minimal and respectful user experience.

## Technology Stack

*   HTML5
*   CSS3
*   Vanilla JavaScript (ES Modules)
*   [PDF.js](https://mozilla.github.io/pdf.js/) library for PDF viewing.

## Structure

*   `index.html`: Main HTML file.
*   `style.css`: CSS styles.
*   `script.js`: Core application logic (including PDF.js integration).
*   `quran_data.json`: Contains Surah names, Rewayat information, and paths.
*   `Media/`: Contains audio files, organized by reciter (`Media/[ReciterName]/[SurahNumber].mp3`).
*   `Written/`: Contains text files for Arabic Rewayat (`Written/[RewayahName]/[SurahNumber].txt`), Juz files (`Written/Ajzaa/[JuzNumber].txt`), and PDF files for English translation/glossary.
*   `fonts/`: Contains custom fonts for specific Rewayat.


## Setup & Usage

1.  Clone the repository.
2.  **Download Media Files:** The audio files (`Media/` directory) are required for playback but are not included in the repository due to their large size. Download the compressed archive `Media.zip` from [https://Hasana.io/Media.zip].
3.  **Extract Media:** Extract the downloaded `Media.zip` file. Place the resulting `Media` folder in the root directory of the cloned project.
4.  **Configure Audio Source (If Hosting Elsewhere):** The application is configured in `script.js` to load audio files from an external URL (see the `baseMediaUrl` variable). If you run the project locally and want it to use the local `Media` folder you just extracted, you might need to comment out the line using `baseMediaUrl` and uncomment the original line that uses the relative `Media/` path within the `updateAudioSource` function. For the deployed version hosted on [https://Hasana.io], it expects the media files to be available at the configured `baseMediaUrl`.
5.  Open `index.html` in a web browser. No build step is strictly required, but running via a local server is recommended for local development to avoid potential issues with file fetching (like CORS).

## Notes

*   The list of available reciters is currently defined in `script.js` and should match the folder names in `Media/`.
*   Rewayat data, including text paths and font mappings, is managed in `quran_data.json`.
*   The Ajzaa section contains 30 Juz files (`Written/Ajzaa/1.txt` to `Written/Ajzaa/30.txt`) that divide the Quran into traditional parts for easier reading and memorization.
*   The English PDF (`Written/All-Surah-en.pdf`) requires bookmarks for the Table of Contents to function correctly. The scripts in `Scripts/` can help manage these.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
