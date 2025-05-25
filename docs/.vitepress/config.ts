import { VERSION } from '../../src/version';
import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'EliCS',
	description: 'Flexible, Robust and Performant ECS for the Web',
	head: [['link', { rel: 'icon', href: '/elics/favicon.ico' }]],
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: '/elixr.svg',
		nav: [
			{ text: 'About', link: '/introduction' },
			{ text: 'Guide', link: '/getting-started' },
			{ text: 'Docs', link: '/architecture/overview ' },
			{
				text: `v${VERSION}`,
				items: [
					{ text: 'NPM', link: 'https://www.npmjs.com/package/elics' },
					{
						text: 'License',
						link: 'https://github.com/elixr-games/elics/blob/main/LICENSE',
					},
				],
			},
		],

		sidebar: [
			{
				text: 'Introduction',
				items: [
					{
						text: 'About EliCS',
						link: '/introduction#what-is-elics',
					},
					{
						text: 'About EliXR Games',
						link: '/introduction#about-elixr-games',
					},
				],
			},
			{
				text: 'Getting Started',
				items: [
					{
						text: 'ECS Principles',
						link: '/getting-started#ecs-principles',
					},
					{
						text: 'Adding EliCS to Your Project',
						link: '/getting-started#adding-elics-to-your-project',
					},
					{
						text: 'Creating a World',
						link: '/getting-started#creating-a-world',
					},
					{
						text: 'Defining Components',
						link: '/getting-started#defining-components',
					},
					{
						text: 'Creating Entities',
						link: '/getting-started#creating-entities',
					},
					{
						text: 'Creating Systems',
						link: '/getting-started#creating-systems',
					},
					{
						text: 'Updating the World',
						link: '/getting-started#updating-the-world',
					},
				],
			},
			{
				text: 'Architecture',
				items: [
					{
						text: 'Overview',
						link: '/architecture/overview',
					},
					{ text: 'Types', link: '/architecture/types' },
					{ text: 'Entity', link: '/architecture/entity' },
					{ text: 'Component', link: '/architecture/component' },
					{ text: 'Query', link: '/architecture/query' },
					{ text: 'System', link: '/architecture/system' },
					{ text: 'World', link: '/architecture/world' },
				],
			},
			{ text: 'Benchmarks', link: '/benchmarks' },
			{
				text: 'Code Coverage',
				link: 'https://app.codecov.io/gh/elixr-games/elics',
			},
		],

		socialLinks: [
			{ icon: 'github', link: 'https://github.com/felixtrz/elics' },
			{ icon: 'twitter', link: 'https://twitter.com/felix_trz' },
		],

		search: {
			provider: 'local',
		},

		footer: {
			message: 'MIT License | Made with ❤️ by Felix Z',
			copyright: 'Copyright © 2022 - present EliXR Games',
		},
	},
	base: '/elics/',
});
