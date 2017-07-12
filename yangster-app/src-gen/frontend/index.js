
import { Container } from 'inversify';
import { FrontendApplication, frontendApplicationModule, loggerFrontendModule } from 'theia-core/lib/application/browser';
import { messagingFrontendModule } from 'theia-core/lib/messaging/browser';

const container = new Container();
container.load(frontendApplicationModule);
container.load(messagingFrontendModule);
container.load(loggerFrontendModule);

function load(raw) {
    return Promise.resolve(raw.default).then(module =>
        container.load(module)
    )
}

function start() {
    const application = container.get(FrontendApplication);
    application.start();
}

Promise.resolve()
.then(function () { return import('theia-core/lib/application/browser/menu/browser-menu-module').then(load) })
.then(function () { return import('theia-core/lib/application/browser/clipboard/browser-clipboard-module').then(load) })
.then(function () { return import('theia-core/lib/filesystem/browser/filesystem-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/workspace/browser/workspace-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/preferences/browser/preference-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/navigator/browser/navigator-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/terminal/browser/terminal-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/editor/browser/editor-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/monaco/browser/monaco-browser-module').then(load) })
.then(function () { return import('theia-core/lib/languages/browser/languages-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/java/browser/java-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/python/browser/python-frontend-module').then(load) })
.then(function () { return import('theia-core/lib/cpp/browser/cpp-frontend-module').then(load) })
.then(function () { return import('theia-yang-extension/lib/frontend/diagram/diagram-module').then(load) })
.then(function () { return import('theia-yang-extension/lib/frontend/language/frontend-extension').then(load) })
.then(start);