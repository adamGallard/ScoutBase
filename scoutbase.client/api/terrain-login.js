// File: /api/terrain-login.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST allowed' });
    }

    try {
        const { region, memberId, password } = req.body;

        if (!region || !memberId || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const fullUsername = `${region}-${memberId}`;

        const clientIds = [
            '6v98tbc09aqfvh52fml3usas3c',
            '5g9rg6ppc5g1pcs5odb7nf7hf9',
            '1u4uajve0lin0ki5n6b61ovva7',
            '21m9o832lp5krto1e8ioo6ldg2'
        ];

        let successfulTokenPair = null;

        for (const clientId of clientIds) {
            const response = await fetch('https://cognito-idp.ap-southeast-2.amazonaws.com/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-amz-json-1.1',
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
                },
                body: JSON.stringify({
                    AuthFlow: 'USER_PASSWORD_AUTH',
                    ClientId: clientId,
                    AuthParameters: {
                        USERNAME: fullUsername,
                        PASSWORD: password
                    }
                })
            });

            const data = await response.json();
            if (data.AuthenticationResult?.AccessToken && data.AuthenticationResult?.IdToken) {
                successfulTokenPair = {
                    accessToken: data.AuthenticationResult.AccessToken,
                    idToken: data.AuthenticationResult.IdToken
                };
                break;
            }
        }

        if (!successfulTokenPair) {
            return res.status(401).json({ error: 'Login failed' });
        }

        // Return tokens for now — in production you can set cookies server-side via middleware
        return res.status(200).json({
            accessToken: successfulTokenPair.accessToken,
            idToken: successfulTokenPair.idToken,
            fullUsername
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Unexpected error' });
    }
}
