// DOM Elements
const video = document.getElementById('video');
const captureButton = document.getElementById('captureButton');
const openCameraButton = document.getElementById('openCameraButton');
const closeModalButtons = document.getElementsByClassName('close');
const restartButton = document.getElementById('restartButton');
const saveButton = document.getElementById('saveButton');
const logBody = document.getElementById('logBody');
const nameInput = document.getElementById('nameInput');

let currentName = ''; // Tracks current user name
let stream = null;    // Stores media stream object
let cachedLocation = null; // Cache location to reduce repeated prompts

// Request camera access and setup video stream
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    captureButton.disabled = false; // Enable capture only if stream active
  } catch (err) {
    alert('Camera access denied or unavailable. Please check permissions or try another browser.');
    console.error('Error accessing camera:', err);
    captureButton.disabled = true;
  }
}

// Disable open camera button if name input is empty
function toggleOpenCameraButton() {
  openCameraButton.disabled = nameInput.value.trim() === '';
}

// Event: Enable/disable Open Camera button on input change
nameInput.addEventListener('input', toggleOpenCameraButton);
toggleOpenCameraButton(); // Initial check on page load

// Show camera modal and start camera stream
openCameraButton.addEventListener('click', () => {
  currentName = nameInput.value.trim();
  if (!currentName) {
    alert('Please enter your name first.');
    return;
  }

  const modal = document.getElementById('cameraModal');
  modal.style.display = 'block';

  if (!stream) startCamera();
});

// Close camera modal handlers
for (const button of closeModalButtons) {
  button.addEventListener('click', () => {
    document.getElementById('cameraModal').style.display = 'none';
  });
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  const modal = document.getElementById('cameraModal');
  if (event.target === modal) modal.style.display = 'none';
});

// Close modal on Escape key press
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const modal = document.getElementById('cameraModal');
    if (modal.style.display === 'block') modal.style.display = 'none';
  }
});

// Capture photo, log attendance with name, time, date, location
captureButton.addEventListener('click', async () => {
  if (!stream) {
    alert('Camera is not active.');
    return;
  }

  // Capture image from video stream
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgUrl = canvas.toDataURL('image/jpeg');

  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();

  // Create new row in attendance log
  const newRow = logBody.insertRow();
  const nameCell = newRow.insertCell();
  const timeCell = newRow.insertCell();
  const dateCell = newRow.insertCell();
  const imgCell = newRow.insertCell();
  const presentCell = newRow.insertCell();
  const locationCell = newRow.insertCell();

  // Image element for captured photo
  const img = document.createElement('img');
  img.src = imgUrl;
  img.width = 100;

  nameCell.textContent = currentName;
  timeCell.textContent = timeString;
  dateCell.textContent = dateString;
  imgCell.appendChild(img);

  // Checkbox for present status
  const presentCheckbox = document.createElement('input');
  presentCheckbox.type = 'checkbox';
  presentCell.appendChild(presentCheckbox);

  // Show loading message while fetching location
  locationCell.textContent = 'Fetching...';

  // Use cached location if available
  if (cachedLocation) {
    locationCell.textContent = cachedLocation;
  } else if (navigator.geolocation) {
    // Fetch geolocation asynchronously
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(5);
        const lon = position.coords.longitude.toFixed(5);
        cachedLocation = `${lat}, ${lon}`; // Cache for reuse
        locationCell.textContent = cachedLocation;
      },
      (error) => {
        console.error('Geolocation error:', error);
        locationCell.textContent = 'Location unavailable';
      }
    );
  } else {
    locationCell.textContent = 'Geolocation not supported';
  }

  // Close camera modal after capture
  document.getElementById('cameraModal').style.display = 'none';
});

// Clear attendance log on restart
restartButton.addEventListener('click', () => {
  logBody.innerHTML = '';
  cachedLocation = null; // Clear cached location too
});

// Save attendance log as PDF
saveButton.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let yPos = 20;

  doc.setFontSize(18);
  doc.text('Attendance Log', 14, yPos);
  yPos += 10;

  const rows = Array.from(logBody.rows);

  rows.forEach((row, index) => {
    const cells = Array.from(row.cells);
    const name = cells[0].textContent;
    const time = cells[1].textContent;
    const date = cells[2].textContent;
    const imgSrc = cells[3].querySelector('img').src;
    const present = cells[4].querySelector('input').checked ? 'Yes' : 'No';
    const location = cells[5]?.textContent || 'N/A';

    doc.setFontSize(12);
    doc.text(`Name: ${name}`, 14, yPos);
    doc.text(`Time: ${time}`, 14, yPos + 6);
    doc.text(`Date: ${date}`, 14, yPos + 12);
    doc.text(`Present: ${present}`, 14, yPos + 18);
    doc.text(`Location: ${location}`, 14, yPos + 24);

    // Add image next to text with some spacing
    doc.addImage(imgSrc, 'JPEG', 100, yPos - 4, 40, 30);

    yPos += 40;

    // Add new page after every 5 entries
    if ((index + 1) % 5 === 0 && index !== rows.length - 1) {
      doc.addPage();
      yPos = 20;
    }
  });

  doc.save('attendance_By_iamshaikhsharik.pdf');
  alert('Attendance log saved as PDF.');
});
