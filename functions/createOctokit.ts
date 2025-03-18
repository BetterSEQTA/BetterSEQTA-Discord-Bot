import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import 'dotenv/config';
const key = Buffer.from(process.env.GITHUB_PRIVATE_KEY , 'base64').toString('ascii');
export const octokit = new Octokit({
	authStrategy: createAppAuth,
	auth: {
		appId: process.env.GITHUB_CLIENT_ID,
		installationId: process.env.GITHUB_INSTALL_ID,
		privateKey: key,
	}
});

