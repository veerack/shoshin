export {};

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (name.length <= 2) {
      return email; // Too short to mask, return as is
  }
  const maskedName = name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  return maskedName + "@" + domain;
}

const emailField = document.getElementById('_sho-mng-email-field') as HTMLInputElement;
if (emailField) {
    const email = emailField.value;
    const maskedEmail = maskEmail(email);
    emailField.value = maskedEmail;
}