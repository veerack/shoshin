let currentStep = 0;
const placeholdersContainer = document.getElementById('filePlaceholders') as HTMLElement;
// Declare a global array to store uploaded files
let uploadedFiles: File[] = [];

// Define an array of texts for each placeholder
const placeholderTexts = [
    "MAIN",
    "WEAPON",
    "MAIN ECHO",
    "2ND ECHO",
    "3RD ECHO",
    "4TH ECHO",
    "5TH ECHO",
    "SKILLS",
    "RS. CHAINS"
    // Add more descriptions as needed
];
const stepTips = [
    "Upload the main section of your resonator page (the first icon on the left column).",
    "Upload the weapon section (the second icon on the left column).",
    "Upload the Main Echo equipped on your Resonator (the top one on the echoes equipped, generally the first COST 4).",
    "Upload the 2nd Echo equipped on your Resonator.",
    "Upload the 3rd Echo equipped on your Resonator.",
    "Upload the 4th Echo equipped on your Resonator.",
    "Upload the 5th Echo equipped on your Resonator.",
    "Upload the Skills section of your Resonator (the 4th icon on the left column).",
    "Upload the Resonance Chains section of your resonator (the 5th icon on the left column)."
];

document.addEventListener('DOMContentLoaded', function() {
    const placeholdersContainer = document.getElementById('filePlaceholders') as HTMLElement;
    let currentStep = 0;

    // Function to update the #stepTip content with step number
    function updateStepTip(currentStep: number) {
        const stepTipElement = document.getElementById('stepTip') as HTMLElement;
        if (stepTipElement && stepTips[currentStep]) {
            // Format the tip with step number and custom text
            stepTipElement.innerHTML = `<p>TIP (Step ${currentStep + 1}): ${stepTips[currentStep]}</p>`;
            stepTipElement.className = 'text-center text-sm text-black dark:text-white'; // Tailwind CSS classes
        }
    }
    
    function initializePlaceholders() {
        // Create line containers
        const firstLineContainer = document.createElement('div');
        firstLineContainer.className = 'flex justify-center items-center flex-wrap mb-4 gap-2'; // Flex container for the first line
    
        const secondLineContainer = document.createElement('div');
        secondLineContainer.className = 'flex justify-center items-center flex-wrap gap-2'; // Flex container for the second line
    
        for (let i = 0; i < 9; i++) {
            // Create the main container div for each placeholder and its description
            const mainContainerDiv = document.createElement('div');
            mainContainerDiv.className = 'flex flex-col items-center justify-center mb-4'; // Margin bottom for spacing
    
            // Create the wrapper div for the image with specified classes
            const wrapperDiv = document.createElement('div');
            // Adjusted classes for a wider appearance
            wrapperDiv.className = 'bg-transparent input-glow-dark p-2 flex justify-center items-center w-48 h-24 border-2 border-dashed border-gray-300 rounded-lg';
    
            // Create the img element
            const img = document.createElement('img');
            img.src = 'https://shoshin.moe/static/empty.png'; // Default placeholder image
            img.className = 'max-w-full max-h-full object-contain';
            img.alt = `Placeholder ${i + 1}`;
    
            // Append the img to the wrapper div
            wrapperDiv.appendChild(img);
    
            // Append the wrapper div to the main container div
            mainContainerDiv.appendChild(wrapperDiv);
    
            // Create and append the description text outside and below the image wrapper
            const descriptionText = document.createElement('span');
            descriptionText.textContent = placeholderTexts[i]; // Get text from array
            descriptionText.className = 'text-center mt-2 text-black dark:text-white font-bold';
            mainContainerDiv.appendChild(descriptionText);
    
            // Append the main container div to the appropriate line container
            if (i < 5) {
                firstLineContainer.appendChild(mainContainerDiv);
            } else {
                secondLineContainer.appendChild(mainContainerDiv);
            }
        }
    
        // Create a new flex container for both line containers
        const flexContainer = document.createElement('div');
        flexContainer.className = 'flex flex-col gap-2'; // Flex column with gap
        // Append line containers to the new flex container
        flexContainer.appendChild(firstLineContainer);
        flexContainer.appendChild(secondLineContainer);
        // Append the new flex container to the placeholders container
        placeholdersContainer.appendChild(flexContainer);
        updateStepTip(0);
    }

    function handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (!files) return;

        // Check if files are selected
        if (files.length === 0) {
            alert('Please select a file.');
            return;
        }

        // Check for the number of files exceeding the remaining placeholders
        if (files.length > 9 - currentStep) {
            alert(`You can only upload ${9 - currentStep} more file(s).`);
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Check file type
            if (!['image/png', 'image/jpg', 'image/jpeg'].includes(file.type)) {
                alert('Only PNG, JPG, and JPEG files are allowed.');
                continue; // Skip this file and continue with the next
            }

            // Check file size (20MB)
            if (file.size > 20 * 1024 * 1024) {
                alert('File size must be less than 20MB.');
                continue; // Skip this file and continue with the next
            }

            // File passes all checks, add it to the uploadedFiles array
            uploadedFiles.push(file);

            if (currentStep < 9) {
                // Assuming the first 5 placeholders are in the firstLineContainer and the rest in the secondLineContainer
                const lineContainerIndex = currentStep < 5 ? 0 : 1; // 0 for firstLineContainer, 1 for secondLineContainer
                const lineContainer = placeholdersContainer.children[0].children[lineContainerIndex] as HTMLElement; // Access the new flex container, then the correct line container
        
                // Calculate the index of the mainContainerDiv within the selected line container
                const mainContainerDivIndex = currentStep < 5 ? currentStep : currentStep - 5;
                const wrapperDiv = lineContainer.children[mainContainerDivIndex] as HTMLElement;
        
                const img = wrapperDiv.getElementsByTagName('img')[0];
                img.src = URL.createObjectURL(file); // Replace placeholder with uploaded file image

                currentStep++;
                updateStepTip(currentStep);
                if (currentStep === 9) {
                    finalizeUpload();
                    break; // Exit the loop if all placeholders are filled
                }
            }
        }
    }

    function showLoadingAnimation() {
        placeholdersContainer.textContent = ''; // Clear existing content

        // Create loading animation using provided SVG
        const loadingHTML = `
            <div role="status">
                <svg aria-hidden="true" class="inline w-8 h-8 text-black animate-spin dark:text-white fill-red-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span id="text-container-loading" class="sr-only text-black dark:text-white ml-2 sans-it font-bold">Hang tight, we're doing some magic...</span>
            </div>
        `;
    
        // Insert the loading animation HTML into the placeholdersContainer
        placeholdersContainer.innerHTML = loadingHTML;
        const textContainer = document.querySelector('#text-container-loading') as HTMLElement; // Adjust the selector to your specific container
        if (textContainer) {
          let html = textContainer.innerHTML;
          // Wrap each period in a span with a class 'period'
          html = html.replace(/\./g, '<span class="period">.</span>');
          textContainer.innerHTML = html;
      
          const periods = textContainer.querySelectorAll('.period') as NodeListOf<HTMLElement>;
          let current = 0;
      
          const animatePeriods = () => {
            // Remove the 'bounce' class from all periods
            periods.forEach(period => period.classList.remove('bounce'));
      
            // Add the 'bounce' class to the current period
            periods[current].classList.add('bounce');
      
            // Move to the next period or loop back to the first
            current = (current + 1) % periods.length;
      
            // Set the next animation to start after the current one finishes
            setTimeout(animatePeriods, 500); // Match the duration of the CSS animation
          };
      
          animatePeriods(); // Start the animation
        }
    }

    function finalizeUpload() {
        const p = [115, 104, 111, 115, 104, 105, 110, 46, 109, 111, 101, 47, 97, 112, 105, 47, 103, 101, 110, 101, 114, 97, 116, 101, 95, 98, 117, 105, 108, 100].map(c => String.fromCharCode(c)).join('').split('/');
        const u = `https://${p[0]}/${p[1]}/${p[2]}`;
        
        const proxyUrlParts = [112, 114, 111, 120, 121];
        const proxyUrl = `https://${p[0]}/${proxyUrlParts.map(c => String.fromCharCode(c)).join('')}`;
    
        showLoadingAnimation();
    
        const formData = new FormData();
        uploadedFiles.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
    
        new Promise((resolve, reject) => {
            const fetchWithTimeout = (url: string, options: RequestInit, timeout = 600000) => {
                return new Promise<Response>((resolve, reject) => {
                    const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
                    fetch(url, options).then(
                        response => {
                            clearTimeout(timer);
                            resolve(response);
                        },
                        err => {
                            clearTimeout(timer);
                            reject(err);
                        }
                    );
                });
            };
    
            const displayImageAndButtons = (data: any) => {
                placeholdersContainer.textContent = '';
    
                const imageAndButtonsContainer = document.createElement('div');
                imageAndButtonsContainer.className = 'flex flex-col justify-center items-center gap-4';
    
                const imgContainer = document.createElement('div');
                imgContainer.className = 'flex flex-row justify-center items-center';
                const img = document.createElement('img');
                img.src = `${data.image}`;
                img.className = 'w-full p-2 md:p-0 md:w-1/2 h-auto';
                img.style.objectFit = 'contain';
    
                imgContainer.appendChild(img);
                imageAndButtonsContainer.appendChild(imgContainer);
    
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'flex flex-row justify-center items-center gap-4';
    
                const downloadButtonUrl = `${proxyUrl}?url=${encodeURIComponent(data.image)}`;
    
                const downloadButton = document.createElement('a');
                downloadButton.href = downloadButtonUrl;
                downloadButton.setAttribute('download', `shoshin_download_${data.name}.png`);
                downloadButton.className = "inline-flex items-center justify-center p-2 cursor-pointer rounded-md bg-white text-black hover:bg-black hover:text-white input-glow w-full";
                downloadButton.innerText = 'Download';
                buttonsContainer.appendChild(downloadButton);
    
                downloadButton.onclick = (e) => {
                    e.preventDefault();
                    fetch(downloadButtonUrl)
                        .then(response => response.blob())
                        .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.style.display = 'none';
                            a.href = url;
                            a.download = `shoshin_download_${data.name}.png`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                        })
                        .catch(err => console.error('Error during download:', err));
                };
    
                const copyButton = document.createElement('a');
                copyButton.href = '#';
                copyButton.className = "inline-flex items-center justify-center p-2 cursor-pointer rounded-md bg-white text-black hover:bg-black hover:text-white input-glow w-full";
                copyButton.innerText = 'Copy URL';
                copyButton.onclick = (e) => {
                    e.preventDefault(); // Prevent the default anchor action
                    navigator.clipboard.writeText(img.src).then(() => {
                        copyButton.innerText = 'URL Copied!'; // Change button text to indicate success
                        setTimeout(() => {
                            copyButton.innerText = 'Copy URL'; // Revert back to original text after 2 seconds
                        }, 2000);
                    }).catch(err => {
                        console.error('Error copying URL:', err);
                    });
                };
                buttonsContainer.appendChild(copyButton); // Append the copy URL button within the flex container
    
                imageAndButtonsContainer.appendChild(buttonsContainer); // Append the buttons container to the main container
    
                placeholdersContainer.appendChild(imageAndButtonsContainer); // Append the new div to the main container
            };
    
            fetchWithTimeout(u, {
                method: 'POST',
                body: formData,
            }, 600000)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.error) {
                    if (data.hasOwnProperty('confirm')) {
                        const confirmationContainer = document.createElement('div');
                        confirmationContainer.className = 'flex flex-col justify-center items-center gap-4';
    
                        const confirmMessage = document.createElement('div');
                        confirmMessage.className = 'text-black dark:text-white font-bold';
                        confirmMessage.innerText = data.confirm;
                        
                        const buttonsRow = document.createElement('div');
                        buttonsRow.className = 'flex flex-row justify-center items-center gap-4';
    
                        const yesButton = document.createElement('button');
                        yesButton.className = 'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded';
                        yesButton.innerText = "Yes, it's me!";
                        yesButton.onclick = () => {
                            showLoadingAnimation();
                            const confirmUrl = `https://${p[0]}/${p[1]}/generate_build`;
                            const confirmPayload = {
                                confirm: true,
                            };
                        
                            // Convert confirmPayload to JSON string and append it to FormData
                            formData.append('confirmPayload', JSON.stringify(confirmPayload));
                        
                            fetchWithTimeout(confirmUrl, {
                                method: 'POST',
                                body: formData
                            }, 600000)
                            .then(response => response.json())
                            .then(confirmData => {
                                console.log(confirmData);
                                displayImageAndButtons(confirmData);
                            })
                            .catch(err => console.error('Error during confirmation:', err));
                        };
    
                        const noButton = document.createElement('button');
                        noButton.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded';
                        noButton.innerText = "Not at all..";
                        noButton.onclick = () => {
                            window.location.reload();
                        };
    
                        buttonsRow.appendChild(yesButton);
                        buttonsRow.appendChild(noButton);
    
                        confirmationContainer.appendChild(confirmMessage);
                        confirmationContainer.appendChild(buttonsRow);
    
                        placeholdersContainer.textContent = '';
                        placeholdersContainer.appendChild(confirmationContainer);
    
                        return reject(data.error);
                    }
                    placeholdersContainer.textContent = data.error || 'Error loading image.';
                    return reject(data.error);
                }
    
                displayImageAndButtons(data);
    
                resolve(data);
            })
            .catch(error => {
                console.error('Error:', error);
                placeholdersContainer.textContent = 'Error loading image.';
                reject(error);
            });
        });
    }

    const fileUploadInput = document.getElementById('fileUpload') as HTMLInputElement;
    fileUploadInput.addEventListener('change', handleFileUpload);

    initializePlaceholders();
});