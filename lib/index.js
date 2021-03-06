/***********************************************************************
 *                                                                   _
 *       _____  _                           ____  _                 |_|
 *      |  _  |/ \   ____  ____ __ ___     / ___\/ \   __   _  ____  _
 *      | |_| || |  / __ \/ __ \\ '_  \ _ / /    | |___\ \ | |/ __ \| |
 *      |  _  || |__. ___/. ___/| | | ||_|\ \___ |  _  | |_| |. ___/| |
 *      |_/ \_|\___/\____|\____||_| |_|    \____/|_| |_|_____|\____||_|
 *
 *      ================================================================
 *                 More than a coder, More than a designer
 *      ================================================================
 *
 *
 *      - Document: index.js
 *      - Author: aleen42
 *      - Description: the main entrance for page-treeview
 *      - Create Time: Apr 11st, 2016
 *      - Update Time: Feb 12nd, 2019
 *
 *
 **********************************************************************/

const _ = require('./fn');

/**
 * [removeMarkdown: convert markdown into plain text]
 * @type {Function}
 */
const RemoveMarkdown = require('remove-markdown');

/**
 * [remarkable: convert markdown into a html]
 * @type {Class}
 */
const Remarkable = require('remarkable');

/**
 * [generateContent: method for generating whole content]
 * @param  {Object} configs   [page configurations]
 * @param  {string} [content] [page contents]
 * @return {string}           [description]
 */
const generateContent = (configs, content = '') => {
	/**
	 * [options: options for generating]
	 * @type {Object}
	 */
	const options = Object.assign({
		'copyright': 'Copyright &#169; aleen42',
		'minHeaderCount': '1',
		'minHeaderDeep': '1',
	}, configs || {});

	const renderContent = pageTreeview.initHeaders(content, options.minHeaderCount, options.minHeaderDeep);

	/** check whether the option copyright is empty */
	const copyRight = options.copyright ? (`
		<div class="treeview__container-title">
			<span class="treeview__main-title">Treeview</span>
			<span class="treeview__copyright">${options.copyright} all right reserved, powered by 
				<a href="https://github.com/aleen42" target="_blank">aleen42</a>
			</span>
	</div>`).replace(/\r?\n|\t/g, '') : '';

	return renderContent ? `<div class="treeview__container">${copyRight + renderContent}</div>` : '';
};

/**
 * [main module]
 * @type {Object}
 */
const pageTreeview = module.exports = {
	/** Map of new style */
	book: {
		assets: './assets',
		css: ['style.css'],
	},

	/** Map of hooks */
	hooks: {
		'page:before': function (page) {
			if (this.output.name !== 'website') {
				return page;
			}

			// @deprecated
			// generateContent(this.options.pluginsConfig['page-treeview'])
			page.content = `${generateContent(this.config.get('pluginsConfig')['page-treeview'], page.content)}\n\n${page.content}`;
			return page;
		}
	},

	/** Map of new blocks */
	blocks: {},

	/** Map of new filters */
	filters: {},

	/**
	 * [test: tests function]
	 * @param  {Object} configs  [simulated configs]
	 * @param  {string} [content] [simulated contents]
	 * @return {string}            [description]
	 */
	test: generateContent,

	/**
	 * [getLevelTab: generate tab for a tree with an array]
	 * @param  {array}  array [description]
	 * @param  {number} index [description]
	 * @param  {number} min   [description]
	 * @return {string}       [description]
	 */
	getLevelTab: (array, index, min) => {
		let ret = '';

		if (index === 0) {
			if (array[index] !== min) {
				for (let i = min; i < array[index]; i++) {
					ret += new Array(i - min + 1).join('\t') + '- &nbsp; \n';
				}
			}
		} else {
			if (array[index] - array[index - 1] > 1) {
				for (let i = array[index - 1] + 1; i < array[index]; i++) {
					ret += new Array(i - min + 1).join('\t') + '- &nbsp; \n';
				}
			}
		}

		return ret + new Array(array[index] - min + 1).join('\t');
	},

	/**
	 * [initHeaders: get headers of a page]
	 * @param  {string} content [description]
	 * @param  {string} count   [description]
	 * @param  {string} deep    [description]
	 * @return {string}         [description]
	 */
	initHeaders: (content, count, deep) => {
		const minHeaderCount = _.isNUM(parseInt(count)) ? parseInt(count) : 1;
		const minHeaderDeep = _.isNUM(parseInt(deep)) ? parseInt(deep) : 1;

		const res = [];
		const levelTab = [];
		const parentNodes = [];

		let minLevel = 6;

		const _calcLevel = str => (/^#+/.exec(str) || [''])[0].length;
		const headers = [].concat(content.match(/^(#)+(\s)*(.*)\n/g))
			.concat(content.match(/\n(#)+(\s)*(.*)/g))
			.map(x => {
				if (x !== null) {
					let ret = x.replaceAll('\n', '');

					/** filter in code block and code line */
					const codeBlock = content.match(/\n```[a-zA-Z]*([\s\S]*?)```/g);
					const codeLine = content.match(/\n`[a-zA-Z]*([\s\S]*?)`/g);

					if (codeBlock !== null) {
						for (let i = 0; i < codeBlock.length; i++) {
							if (codeBlock[i].indexOf(ret) >= 0) {
								return null;
							}
						}
					}

					if (codeLine !== null) {
						for (let i = 0; i < codeLine.length; i++) {
							if (codeLine[i].indexOf(ret) >= 0) {
								return null;
							}
						}
					}

					ret = ret.replace(/<.*?\/>/g, '')
						.replace(/<.*?>(.*?)<\/.*?>/g, '$1');

					const level = _calcLevel(ret);
					if (level <= minLevel) {
						minLevel = level;
					}

					levelTab.push(level);

					return ret;
				} else {
					return x;
				}
			});

		let nullCount = 0;
		let maxDeep = 0;

		for (let i = 0; i < headers.length; i++) {
			if (headers[i] === null) {
				nullCount++;
			} else {
				const value = headers[i].replace(new Array(_calcLevel(headers[i]) + 1).join('#'), '').leftTrim();
				const tabs = pageTreeview.getLevelTab(levelTab, i - nullCount, minLevel);
				const tabLen = levelTab[i - nullCount] - minLevel + 1;

				maxDeep = maxDeep < tabLen ? tabLen : maxDeep;

				if (levelTab[i - nullCount] < levelTab[i + 1 - nullCount]) {
					/** it means that it's a current node */
					parentNodes.push(i - nullCount);
				}

				res.push(`${tabs}- [${RemoveMarkdown(pageTreeview.filterValue(value), {stripListLeaders: false})}](#${pageTreeview.convertID(value)})`);
			}
		}

		/** check whether the number headers is greater than the value `minHeaderCount` */
		if (headers.length - nullCount < minHeaderCount && maxDeep < minHeaderDeep) {
			return '';
		}

		let generatedHTML = new Remarkable().render(res.join('\n'));

		/** replace a tag with wrapped into a block */
		generatedHTML = generatedHTML.replace(/<a[\s\S]+?>[\s\S]+?<\/a>/g, match => `<div>${match}<i></i></div>`);

		/** give a class name and event handler if it's parentNodes */
		let node;
		let currentNodeIndex = 0;

		const regex = /<i[\s\S]+?<\/i>/g;
		while (node = regex.exec(generatedHTML)) {
			if (node.index === regex.lastIndex) {
				/** Don't let browsers get stuck in an infinite loop */
				regex.lastIndex++;
			}

			if (parentNodes.indexOf(currentNodeIndex++) > -1) {
				/** it's a parent node and replace it */
				/** the length of "<div" is 4 */
				const separatorIndex = '<i'.length;
				generatedHTML = generatedHTML.substring(0, node.index + separatorIndex)
					+ ' class="level__parent level__item level__parent--opened" state="opened" onclick="'
					+ 'var curState = this.getAttribute(\'state\');'
					+ 'var nextState = curState === \'opened\' ? \'hidden\' : \'opened\';'
					+ 'this.setAttribute(\'state\', nextState);'
					+ 'this.className = this.className.split(curState).join(nextState);'
					+ ''
					+ 'var list = this.parentNode.nextElementSibling;'
					+ 'if (nextState === \'hidden\') {'
					+ '    list.style.display = \'none\';'
					+ '} else {'
					+ '    list.style.display = \'block\';'
					+ '}'
					+ '"'
					+ generatedHTML.substring(node.index + separatorIndex);
			}
		}

		return generatedHTML;
	},

	/**
	 * escape cases: "[sub] title [back]()" => "&#91;sub&#93; title [back]()"
	 * [filterValue: filter value of headers]
	 *
	 * @param  {string} str [description]
	 * @return {string}     [description]
	 */
	filterValue: str => str.replace(/^\[(.+?)](?!\()+/g, ($0, $1) => `${_.A2U('[')}${$1}${_.A2U(']')}`),

	/**
	 * [convertID: convert a markdown string into a id generated by gitbook]
	 * @param  {string} str [description]
	 * @return {string}     [description]
	 */
	convertID: str => RemoveMarkdown(
		/** convert \t into ---- */
		_.E2A(str.replaceAll('\t', '----')
		/** remove “ and ” */
			.replaceAll('“', '')
			.replaceAll('”', '')
			.toLowerCase()
			.trim()
			.replaceAll(' ', '-'))).split('')
		.filter(str => /** alpha */(str.charCodeAt(0) >= 97 && str.charCodeAt(0) <= 122)
			|| str.charCodeAt(0) === 45
			|| str.charCodeAt(0) > 126
			|| str.charCodeAt(0) >= 48 && str.charCodeAt(0) <= 57)
		.join('')
		.replace(/^-/, ''),
};
