export function initContactForm(formId = 'contact-form', documentRef = document) {
    const form = documentRef.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            name: formData.get('name')?.trim(),
            email: formData.get('email')?.trim(),
            subject: formData.get('subject')?.trim(),
            message: formData.get('message')?.trim()
        };

        const missingField = Object.entries(payload).find(([, value]) => !value);
        if (missingField) {
            alert('Please fill out all fields before submitting the form.');
            return;
        }

        console.log('Contact form submission:', payload);

        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                await db.collection('messages').add({
                    ...payload,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Thank you for your message! I will get back to you soon.');
                form.reset();
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Sorry, there was an error sending your message. Please try again later.');
            }
            return;
        }

        alert('Thank you for your message! (Simulated – database not configured)');
        form.reset();
    });
}

export default initContactForm;
