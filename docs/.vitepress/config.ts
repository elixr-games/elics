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
			{ text: 'Home', link: '/' },
			{ text: 'Documentation', link: '/architecture/overview ' },
		],

		sidebar: [
			{
				text: 'Architecture',
				items: [
					{
						text: 'Overview',
						link: '/architecture/overview',
					},
					{ text: 'Entity', link: '/architecture/entity' },
					{ text: 'Component', link: '/architecture/component' },
					{ text: 'System', link: '/architecture/system' },
					{ text: 'Query', link: '/architecture/query' },
					{ text: 'World', link: '/architecture/world' },
				],
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
			copyright: 'Copyright © 2022 - present Elixr Games',
		},
	},
	base: '/elics/',
});
