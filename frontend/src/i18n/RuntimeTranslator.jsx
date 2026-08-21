import React from 'react';
import { useTranslation } from 'react-i18next';
import { translatePhrase } from './phraseTranslator';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'INPUT', 'TEXTAREA', 'SELECT']);
const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const originalTextNodes = new WeakMap();

const shouldTranslateText = (text) => {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/^[\d\s.,:/+-]+$/.test(value)) return false;
  return value.length <= 180;
};

const walkNodes = (root, { onElement, onText }) => {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.currentNode;

  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current;
      if (SKIP_TAGS.has(element.tagName) || element.closest('[data-i18n-skip="true"]')) {
        current = walker.nextSibling();
        continue;
      }

      onElement?.(element);
    }

    if (current.nodeType === Node.TEXT_NODE && !current.parentElement?.closest('[data-i18n-skip="true"]')) {
      onText?.(current);
    }

    current = walker.nextNode();
  }
};

const translateTextNode = (node, language) => {
  const original = originalTextNodes.get(node) || node.nodeValue;
  if (!shouldTranslateText(original)) return;

  originalTextNodes.set(node, original);
  node.nodeValue = translatePhrase(original, language);
};

const translateAttributes = (element, language) => {
  ATTRIBUTES.forEach((attribute) => {
    const currentValue = element.getAttribute(attribute);
    if (!shouldTranslateText(currentValue)) return;

    const dataName = `data-i18n-original-${attribute}`;
    const original = element.getAttribute(dataName) || currentValue;
    element.setAttribute(dataName, original);
    element.setAttribute(attribute, translatePhrase(original, language));
  });
};

const restoreTextNode = (node) => {
  const original = originalTextNodes.get(node);
  if (!original) return;
  node.nodeValue = original;
};

const restoreAttributes = (element) => {
  ATTRIBUTES.forEach((attribute) => {
    const dataName = `data-i18n-original-${attribute}`;
    const original = element.getAttribute(dataName);
    if (!original) return;

    element.setAttribute(attribute, original);
    element.removeAttribute(dataName);
  });
};

const walkAndTranslate = (root, language) => {
  walkNodes(root, {
    onElement: (element) => translateAttributes(element, language),
    onText: (node) => translateTextNode(node, language)
  });
};

const restoreOriginalContent = (root) => {
  walkNodes(root, {
    onElement: restoreAttributes,
    onText: restoreTextNode
  });
};

const RuntimeTranslator = ({ children }) => {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    const language = String(i18n.language || 'en').split('-')[0];
    if (!document.body) return undefined;

    const syncDocumentLanguage = () => {
      if (language === 'en') {
        restoreOriginalContent(document.body);
        return;
      }

      walkAndTranslate(document.body, language);
    };

    let raf = requestAnimationFrame(syncDocumentLanguage);

    if (language === 'en') {
      return () => cancelAnimationFrame(raf);
    }

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncDocumentLanguage);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [i18n.language]);

  return children;
};

export default RuntimeTranslator;
