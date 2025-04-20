// File: /api/terrain-login.js

import { NextResponse } from 'next/server';

export const config = {
    runtime: 'edge'
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new NextResponse(JSON.stringify({ error: 'Only POST allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
        }

    try {
        const { region, memberId, password } = await req.json();
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
            return new NextResponse(JSON.stringify({ error: 'Login failed' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const headers = new Headers({
            'Set-Cookie': [
                `scoutbase-idtoken=${successfulTokenPair.idToken}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Strict`,
                `scoutbase-token=${successfulTokenPair.accessToken}; HttpOnly; Secure; Path=/; Max-Age=3600; SameSite=Strict`,
                `scoutbase-terrain-userid=${fullUsername}; Path=/; Max-Age=3600; SameSite=Strict`
            ]
        });

        return new NextResponse(null, {
            status: 302,
            headers: {
                ...headers,
                Location: '/admin'
            }
        });
    } catch (err) {
        console.error(err);
        return new NextResponse(JSON.stringify({ error: 'Unexpected error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
