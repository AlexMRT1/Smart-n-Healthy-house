document.addEventListener('DOMContentLoaded', () => {
    const circle = document.querySelector('.progress-ring__circle');
    const cameraInstruction = document.getElementById('cameraInstruction');
    const video = document.getElementById('faceCamera');
    const setupContainer = document.querySelector('.setup-container');
    const cameraContainer = document.getElementById('cameraContainer');
    const successContainer = document.querySelector('.success-container');
    const startButton = document.getElementById('startFaceSetup');
    const skipButton = document.getElementById('skipSetup');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    let progress = 0;
    let photos = 0;
    const requiredPhotos = 20;
    let lastPosition = null;
    let noMovementCounter = 0;
    const maxNoMovementFrames = 10; // Número de frames sin movimiento antes de mostrar error

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    function setProgress(percent) {
        const offset = circumference - (percent / 100 * circumference);
        circle.style.strokeDashoffset = offset;
    }

    function detectMovement() {
        const track = video.srcObject.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);

        imageCapture.grabFrame().then((bitmap) => {
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const currentPosition = calculateHeadPosition(imageData);

            if (lastPosition && isHeadStationary(lastPosition, currentPosition)) {
                noMovementCounter++;
                if (noMovementCounter >= maxNoMovementFrames) {
                    // Mostrar error si no hay movimiento
                    circle.classList.add('error');
                    cameraInstruction.classList.add('blink');
                }
            } else {
                // Reiniciar contador si hay movimiento
                noMovementCounter = 0;
                circle.classList.remove('error');
                cameraInstruction.classList.remove('blink');
            }

            lastPosition = currentPosition;
        }).catch((err) => {
            console.error('Error detecting movement:', err);
        });
    }

    function calculateHeadPosition(imageData) {
        let sumX = 0, sumY = 0, count = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            const brightness = imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2];
            if (brightness > 200) { // Umbral para detectar píxeles brillantes
                const x = (i / 4) % imageData.width;
                const y = Math.floor((i / 4) / imageData.width);
                sumX += x;
                sumY += y;
                count++;
            }
        }
        return count > 0 ? { x: sumX / count, y: sumY / count } : null;
    }

    function isHeadStationary(lastPosition, currentPosition) {
        if (!lastPosition || !currentPosition) return false; // Si no hay posición previa, no está quieto
        const dx = Math.abs(lastPosition.x - currentPosition.x);
        const dy = Math.abs(lastPosition.y - currentPosition.y);
        return dx < 5 && dy < 5; // Umbral más estricto para detectar movimiento
    }

    async function capturePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            // Simular el almacenamiento de la foto
            photos++;
            progress = (photos / requiredPhotos) * 100;
            setProgress(progress);
        }, 'image/jpeg');
    }

    function completeSetup() {
        // Detener el video y mostrar el contenedor de éxito
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());

        cameraContainer.style.opacity = '0';
        setTimeout(() => {
            cameraContainer.style.display = 'none';
            successContainer.style.display = 'block';
            successContainer.style.opacity = '1';
        }, 300);

        localStorage.setItem('setupCompleted', 'true');
    }

    startButton.addEventListener('click', async () => {
        try {
            setupContainer.style.opacity = '0';
            setTimeout(() => {
                setupContainer.style.display = 'none';
                cameraContainer.style.display = 'flex';
                cameraContainer.style.opacity = '1';
            }, 300);

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            video.srcObject = stream;

            const captureInterval = setInterval(() => {
                detectMovement();
                if (noMovementCounter < maxNoMovementFrames) {
                    if (photos < requiredPhotos) {
                        capturePhoto();
                    } else {
                        clearInterval(captureInterval);
                        completeSetup();
                    }
                }
            }, 500);
        } catch (err) {
            console.error('Error accessing camera:', err);
        }
    });

    skipButton.addEventListener('click', () => {
        localStorage.setItem('setupSkipped', 'true');
        window.location.href = '/SmartHealthyHouse/www/Index.html';
    });
});