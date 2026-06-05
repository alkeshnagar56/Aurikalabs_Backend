const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient =
    SibApiV3Sdk.ApiClient.instance;

defaultClient.authentications[
    "api-key"
].apiKey =
    process.env.BREVO_API_KEY;

const apiInstance =
    new SibApiV3Sdk.TransactionalEmailsApi();

async function sendEmail(
    to,
    subject,
    htmlContent,
) {
    try {
        await apiInstance.sendTransacEmail({
            sender: {
                name: "Aurika Labs",
                email:
                    process.env.EMAIL_FROM,
            },

            to: [
                {
                    email: to,
                },
            ],

            subject,

            htmlContent,
        });

        return true;
    } catch (error) {
        console.error(
            "Brevo Email Error:",
            error,
        );

        throw error;
    }
}

module.exports = {
    sendEmail,
};