/**
 * @description link 菜单 panel tab 配置
 * @author wangfupeng
 */

import Editor from '../../editor/index'
import { PanelConf } from '../menu-constructors/Panel'
import { getRandom } from '../../utils/util'
import $, { DomElement } from '../../utils/dom-core'
import isActive from './is-active'

export default function (editor: Editor, text: string, link: string): PanelConf {
    // panel 中需要用到的id
    const inputLinkId = getRandom('input-link')
    const inputTextId = getRandom('input-text')
    const btnOkId = getRandom('btn-ok')
    const btnDelId = getRandom('btn-del')

    // 是否显示“取消链接”
    const delBtnDisplay = isActive(editor) ? 'inline-block' : 'none'

    let $selectedLink: DomElement

    /**
     * 选中整个链接元素
     */
    function selectLinkElem(): void {
        if (!isActive(editor)) return

        const $linkElem = editor.selection.getSelectionContainerElem()
        if (!$linkElem) return
        editor.selection.createRangeByElem($linkElem)
        editor.selection.restoreSelection()

        $selectedLink = $linkElem // 赋值给函数内全局变量
    }

    /**
     * 插入链接
     * @param text 文字
     * @param link 链接
     */
    function insertLink(text: string, link: string): void {
        if (isActive(editor)) {
            // 选区处于链接中，则选中整个菜单，再执行 insertHTML
            selectLinkElem()
            editor.cmd.do('insertHTML', `<a href="${link}" target="_blank">${text}</a>`)
        } else {
            // 选区未处于链接中，直接插入即可
            editor.cmd.do('insertHTML', `<a href="${link}" target="_blank">${text}</a>`)
        }
    }

    /**
     * 取消链接
     */
    function delLink(): void {
        if (!isActive(editor)) {
            return
        }
        // 选中整个链接
        selectLinkElem()
        // 用文本替换链接
        const selectionText = $selectedLink.text()
        editor.cmd.do('insertHTML', '<span>' + selectionText + '</span>')
    }

    /**
     * 校验链接是否合法
     * @param link 链接
     */
    function checkLink(text: string, link: string): boolean {
        //查看开发者自定义配置的返回值
        const check = editor.config.linkCheck(text, link)
        if (check === undefined) {
            //用户未能通过开发者的校验，且开发者不希望编辑器提示用户
        } else if (check === true) {
            //用户通过了开发者的校验
            return true
        } else {
            //用户未能通过开发者的校验，开发者希望我们提示这一字符串
            editor.config.customAlert(check, 'warning')
        }
        return false
    }

    /**
     * 生成需要插入的html内容的字符串形式
     */
    function insertHtml() {
        editor.selection.restoreSelection()
        const selection = window.getSelection()
        const anchorNode = selection?.anchorNode
        const focusNode = selection?.focusNode
        const anchorPos = selection?.anchorOffset
        const focusPos = selection?.focusOffset

        let content = ''
        let startContent: string | undefined = ''
        let middleContent: string = ''
        let endContent: string | undefined = ''

        let startNode = anchorNode
        let endNode = focusNode
        // 用来保存 anchorNode的非p最外层节点
        let pointerNode = anchorNode

        // 节点是同一个的处理
        if (anchorNode?.isEqualNode(focusNode ?? null)) {
            return anchorNode.textContent?.substring(anchorPos ?? 0, focusPos)
        }

        // 选中开始位置节点的处理
        let selectContent = startNode?.textContent?.substring(anchorPos ?? 0)
        do {
            startNode = pointerNode
            startContent = makeHtmlString(startNode?.nodeName ?? '', selectContent ?? '')
            selectContent = startContent
            pointerNode = pointerNode?.parentNode
        } while (pointerNode?.nodeName !== 'P')

        // 结束位置节点的处理
        let endSelectContent = focusNode?.textContent?.substring(0, focusPos)
        pointerNode = focusNode
        do {
            endNode = pointerNode
            endContent = makeHtmlString(endNode?.nodeName ?? '', endSelectContent ?? '')
            endSelectContent = endContent
            pointerNode = pointerNode?.parentNode
        } while (pointerNode?.nodeName !== 'P')

        // 将直接节点位置放置到开始的节点
        pointerNode = startNode?.nextSibling
        // 处于开始和结束节点位置之间的节点的处理
        while (!pointerNode?.isEqualNode(endNode ?? null)) {
            const pointerNodeName = pointerNode?.nodeName
            if (pointerNodeName === '#text') {
                middleContent = middleContent + pointerNode?.textContent
            } else {
                let htmlString = pointerNode?.firstChild?.parentElement?.innerHTML
                middleContent =
                    middleContent + makeHtmlString(pointerNodeName ?? '', htmlString ?? '')
            }
            pointerNode = pointerNode?.nextSibling
        }

        content = `${startContent}${middleContent}${endContent}`

        return content
    }

    /**
     * 生成html的string形式
     */
    function makeHtmlString(tagName: string, content: string): string {
        if (tagName === '' || tagName === '#text') {
            return content
        }
        tagName = tagName.toLowerCase()
        return `<${tagName}>${content}</${tagName}>`
    }

    const conf = {
        width: 300,
        height: 0,

        // panel 中可包含多个 tab
        tabs: [
            {
                // tab 的标题
                title: editor.i18next.t('menus.panelMenus.link.链接'),
                // 模板
                tpl: `<div>
                        <input
                            id="${inputTextId}"
                            type="text"
                            class="block"
                            value="${text}"
                            placeholder="${editor.i18next.t('menus.panelMenus.link.链接文字')}"/>
                        </td>
                        <input
                            id="${inputLinkId}"
                            type="text"
                            class="block"
                            value="${link}"
                            placeholder="${editor.i18next.t('如')} https://..."/>
                        </td>
                        <div class="w-e-button-container">
                            <button type="button" id="${btnOkId}" class="right">
                                ${editor.i18next.t('插入')}
                            </button>
                            <button type="button" id="${btnDelId}" class="gray right" style="display:${delBtnDisplay}">
                                ${editor.i18next.t('menus.panelMenus.link.取消链接')}
                            </button>
                        </div>
                    </div>`,
                // 事件绑定
                events: [
                    // 插入链接
                    {
                        selector: '#' + btnOkId,
                        type: 'click',
                        fn: () => {
                            // 执行插入链接
                            const $link = $('#' + inputLinkId)
                            const $text = $('#' + inputTextId)
                            let link = $link.val().trim()
                            let text = $text.val().trim()
                            let html = insertHtml()?.trim()
                            let htmlText = html?.replace(/<.*?>/g, '')
                            let htmlTextLen = htmlText?.length ?? 0
                            // 当input中的text的长度大于等于选区的文字时
                            // 需要判断两者相同的长度的text内容是否相同
                            // 相同则只需把多余的部分添加上去即可，否则使用input中的内容
                            if (htmlTextLen <= text.length) {
                                let startText = text.substring(0, htmlTextLen)
                                let endText = text.substring(htmlTextLen)
                                if (htmlText === startText) {
                                    text = html + endText
                                }
                            }
                            // 链接为空，则不插入
                            if (!link) return
                            // 文本为空，则用链接代替
                            if (!text) text = link
                            // 校验链接是否满足用户的规则，若不满足则不插入
                            if (!checkLink(text, link)) return
                            insertLink(text, link)

                            // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                            return true
                        },
                    },
                    // 取消链接
                    {
                        selector: '#' + btnDelId,
                        type: 'click',
                        fn: () => {
                            // 执行取消链接
                            delLink()

                            // 返回 true，表示该事件执行完之后，panel 要关闭。否则 panel 不会关闭
                            return true
                        },
                    },
                ],
            }, // tab end
        ], // tabs end
    }

    return conf
}
