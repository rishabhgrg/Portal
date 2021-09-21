import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import setupAnalytics from './analytics';
import setupGhostApi from './utils/api';
import {hasMode} from './utils/check-mode';

const ROOT_DIV_ID = 'ghost-portal-root';

function addRootDiv() {
    const elem = document.createElement('div');
    elem.id = ROOT_DIV_ID;
    document.body.appendChild(elem);
}

function getSiteUrl() {
    /**
     * @type {HTMLElement}
     */
    const scriptTag = document.querySelector('script[data-ghost]');
    if (scriptTag) {
        return scriptTag.dataset.ghost;
    }
    return '';
}

function handleTokenUrl() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('token')) {
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.href);
    }
}

function setupAnalyticsScript({siteUrl}) {
    const analyticsTag = document.querySelector('meta[name=ghost-analytics-id]');
    const analyticsId = analyticsTag?.content;
    if (siteUrl && analyticsTag) {
        setupAnalytics({siteUrl, analyticsId});
    }
}

async function fetchApiData() {
    try {
        const customSiteUrl = getSiteUrl();
        const siteUrl = customSiteUrl || window.location.origin;
        const GhostApi = setupGhostApi({siteUrl});
        const {site, member} = await GhostApi.init();

        return {site, member};
    } catch (e) {
        if (hasMode(['dev', 'test'], {customSiteUrl: getSiteUrl()})) {
            return {};
        }
        throw e;
    }
}

async function setup({siteUrl}) {
    const {site, member} = await fetchApiData();
    addRootDiv();
    handleTokenUrl();
    setupAnalyticsScript({siteUrl});
    return {site, member};
}

async function init() {
    const customSiteUrl = getSiteUrl();
    const siteUrl = customSiteUrl || window.location.origin;
    try {
        const {site, member} = await setup({siteUrl});
        ReactDOM.render(
            <React.StrictMode>
                <App siteUrl={siteUrl} customSiteUrl={customSiteUrl} site={site} member={member} />
            </React.StrictMode>,
            document.getElementById(ROOT_DIV_ID)
        );
    } catch (e) {
        /* eslint-disable no-console */
        console.error(`[Portal] Failed to initialize:`, e);
        /* eslint-enable no-console */
    }
}

init();
