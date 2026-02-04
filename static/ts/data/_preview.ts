declare var CodeMirror: {
    fromTextArea: (textArea: HTMLTextAreaElement, options: any) => CodeMirrorEditor;
};

interface CodeMirrorEditor {
    getValue: () => string;
    setValue: (value: string) => void;
    setSize: (width: string | number | null, height: string | number | null) => void;
    replaceSelection: (text: string, select: string) => void;
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror on the textarea
    const textArea = document.getElementById('custom-css-input') as HTMLTextAreaElement;
    const editor = CodeMirror.fromTextArea(textArea, {
        mode: 'css',
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        extraKeys: {
            'Tab': function(cm: CodeMirrorEditor) {
                cm.replaceSelection('    ', 'end');
            },
            'Ctrl-Space': 'autocomplete'
        }
    });

    // Set the initial height to 20em
    editor.setSize(null, '20em');

    const previewButton = document.getElementById('preview-changes-button') as HTMLButtonElement;
    previewButton.addEventListener('click', function() {
        const customCSS = editor.getValue();
        const previewAreaId = 'preview-area';

        // Remove any previous custom styles
        let oldStyleTag = document.getElementById('custom-css-style') as HTMLStyleElement;
        if (oldStyleTag) {
            oldStyleTag.remove();
        }

        // Create a new style tag with the custom CSS
        const styleTag = document.createElement('style');
        styleTag.id = 'custom-css-style';

        // Wrap user-provided CSS in a scoped CSS block
        styleTag.textContent = `#${previewAreaId} { ${customCSS} }`;

        // Append the new style tag to the head
        document.head.appendChild(styleTag);

        // Apply selected background from localStorage
        const backgroundData = JSON.parse(localStorage.getItem('selectedBackground') || '{}');
        if (backgroundData && backgroundData.backgroundImage) {
            const previewArea = document.getElementById(previewAreaId) as HTMLElement;
            previewArea.style.backgroundImage = backgroundData.backgroundImage;
            previewArea.style.backgroundSize = 'cover';
        }

        // Apply selected avatar effect from localStorage
        const avatarEffectData = JSON.parse(localStorage.getItem('selectedAvatarEffect') || '{}');
        if (avatarEffectData && avatarEffectData.avatarEffect) {
            const avatarEffectImg = document.getElementById('avatar-effect') as HTMLImageElement;
            if (avatarEffectImg) {
                avatarEffectImg.src = avatarEffectData.avatarEffect;
                avatarEffectImg.style.display = 'block';
            }
        }

        // Apply selected color from localStorage
        const selectedColor = localStorage.getItem('selectedColor');
        if (selectedColor) {
            const profileElement = document.getElementById("shoshin-profile") as HTMLElement;
            if (profileElement) {
                profileElement.className = `flex flex-col gap-4 border-green-400 border-2 rounded-md w-full md:w-1/2 mx-auto pb-4 ${selectedColor}`;
            }
        }
    });
});