import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Response {
    ok: boolean;
    statusText: string;
    json(): Promise<any>;
}

interface PRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
}

interface PRComment {
    user: string | undefined;
    body: string;
}

interface GitHubFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
}

interface GitHubComment {
    id: number;
    node_id: string;
    url: string;
    body?: string;
    body_text?: string;
    body_html?: string;
    html_url: string;
    user: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string | null;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
    } | null;
    created_at: string;
    updated_at: string;
    issue_url: string;
    author_association: string;
    reactions?: {
        url: string;
        total_count: number;
        '+1': number;
        '-1': number;
        laugh: number;
        hooray: number;
        confused: number;
        heart: number;
        rocket: number;
        eyes: number;
    };
}

interface GitHubPR {
    title: string;
    body: string | null;
    number: number;
    state: string;
    html_url: string;
    user: {
        login: string;
    };
}

// Function to split message into chunks that fit Discord's 2000 character limit
function splitMessage(message: string): string[] {
    const chunks: string[] = [];
    const maxLength = 1900; // Leave some buffer for safety

    while (message.length > 0) {
        if (message.length <= maxLength) {
            chunks.push(message);
            break;
        }

        // Find the last newline within the maxLength
        let splitIndex = message.lastIndexOf('\n', maxLength);
        if (splitIndex === -1) {
            // If no newline found, split at maxLength
            splitIndex = maxLength;
        }

        chunks.push(message.substring(0, splitIndex));
        message = message.substring(splitIndex + 1);
    }

    return chunks;
}

export default {
    data: new SlashCommandBuilder()
        .setName('review')
        .setDescription('Review a GitHub pull request using AI')
        .addStringOption(option =>
            option.setName('pr_url')
                .setDescription('The URL of the pull request to review (e.g., https://github.com/BetterSEQTA/DesQTA/pull/36)')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const prUrl = interaction.options.getString('pr_url')!;
        
        try {
            // Parse the PR URL to get owner, repo, and PR number
            const urlMatch = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
            if (!urlMatch) {
                await interaction.editReply('Invalid GitHub PR URL. Please provide a URL in the format: https://github.com/owner/repo/pull/number');
                return;
            }

            const [, owner, repoName, prNumberStr] = urlMatch;
            const prNumber = parseInt(prNumberStr);

            // Get PR details using public API
            const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`) as Response;
            if (!prResponse.ok) {
                throw new Error(`Failed to fetch PR: ${prResponse.statusText}`);
            }
            const pr = await prResponse.json() as GitHubPR;

            // Get PR files using public API
            const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files`) as Response;
            if (!filesResponse.ok) {
                throw new Error(`Failed to fetch PR files: ${filesResponse.statusText}`);
            }
            const files = await filesResponse.json() as GitHubFile[];

            // Get PR comments using public API
            const commentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`) as Response;
            if (!commentsResponse.ok) {
                throw new Error(`Failed to fetch PR comments: ${commentsResponse.statusText}`);
            }
            const comments = await commentsResponse.json() as GitHubComment[];

            // Prepare context for Gemini
            const context = {
                title: pr.title,
                description: pr.body || 'No description provided',
                files: files.map((file: GitHubFile): PRFile => ({
                    filename: file.filename,
                    status: file.status,
                    additions: file.additions,
                    deletions: file.deletions,
                    changes: file.changes
                })),
                comments: comments.map((comment: GitHubComment): PRComment => ({
                    user: comment.user?.login,
                    body: comment.body || ''
                }))
            };

            // Create a new chat with Gemini
            const chat = ai.chats.create({
                model: "gemini-2.5-flash-preview-05-20",
                config: {
                    systemInstruction: "You are a code review assistant. Review the provided pull request and give constructive feedback. Focus on code quality, potential bugs, and best practices. Be specific and provide examples when possible."
                }
            });

            // Send the context to Gemini
            const response = await chat.sendMessage({
                message: `Please review this pull request:\n\nTitle: ${context.title}\nDescription: ${context.description}\n\nFiles changed:\n${context.files.map((f: PRFile) => `- ${f.filename} (${f.status}, +${f.additions}, -${f.deletions})`).join('\n')}\n\nComments:\n${context.comments.map((c: PRComment) => `- ${c.user}: ${c.body}`).join('\n')}`
            });

            // Split the response into chunks if needed
            const messageChunks = splitMessage(`## Code Review for [PR #${prNumber}](${prUrl})\n\n${response.text}`);

            // Send the first chunk as the initial reply
            await interaction.editReply(messageChunks[0]);

            // Send remaining chunks as follow-up messages
            for (let i = 1; i < messageChunks.length; i++) {
                await interaction.followUp(messageChunks[i]);
            }

        } catch (error) {
            console.error('Error reviewing PR:', error);
            await interaction.editReply({
                content: 'Sorry, there was an error reviewing the pull request. Please make sure the URL is correct and the repository is accessible.'
            });
        }
    }
}; 