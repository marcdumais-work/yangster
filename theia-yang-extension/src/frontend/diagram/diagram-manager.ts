/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { TheiaDiagramServer } from './theia-diagram-server'
import { TheiaSprottyConnector } from './theia-sprotty-connector'
import { DiagramConfigurationRegistry } from './diagram-configuration'
import { injectable, inject } from "inversify"
import { OpenerOptions, OpenHandler, FrontendApplication, FrontendApplicationContribution } from "@theia/core/lib/browser"
import URI from "@theia/core/lib/common/uri"
import { DiagramWidget } from "./diagram-widget"
import { DiagramWidgetRegistry } from "./diagram-widget-registry"
import { Emitter, Event, SelectionService } from '@theia/core/lib/common'
import { TYPES } from 'sprotty/lib'

export const DiagramManagerProvider = Symbol('DiagramManagerProvider')

export type DiagramManagerProvider = () => Promise<DiagramManager>

export interface DiagramManager extends OpenHandler, FrontendApplicationContribution {
    readonly diagramType: string
    readonly onDiagramOpened: Event<URI>
}

@injectable()
export abstract class DiagramManagerImpl implements DiagramManager {

    @inject(DiagramWidgetRegistry) protected readonly widgetRegistry: DiagramWidgetRegistry
    @inject(SelectionService) protected readonly selectionService: SelectionService
    @inject(DiagramConfigurationRegistry) protected diagramConfigurationRegistry: DiagramConfigurationRegistry

    protected readonly onDiagramOpenedEmitter = new Emitter<URI>()

    abstract get diagramType(): string
    abstract get diagramConnector(): TheiaSprottyConnector
    abstract iconClass: string

    get id() {
        return this.diagramType + "-diagram-opener"
    }

    private _resolveApp: (app: FrontendApplication) => void

    protected readonly resolveApp = new Promise<FrontendApplication>(resolve =>
        this._resolveApp = resolve
    )

    get onDiagramOpened(): Event<URI> {
        return this.onDiagramOpenedEmitter.event
    }

    onStart(app: FrontendApplication): void {
        this._resolveApp(app)
    }

    canHandle(uri: URI, options?: OpenerOptions | undefined): number {
        return 10
    }

    open(uri: URI, input?: OpenerOptions): Promise<DiagramWidget> {
        const promiseDiagramWidget = this.getOrCreateDiagramWidget(uri)
        promiseDiagramWidget.then((diagramWidget) => {
            this.resolveApp.then(app => {
                app.shell.activateMain(diagramWidget.id)
                this.onDiagramOpenedEmitter.fire(uri)
            })
        })
        return promiseDiagramWidget
    }

    protected getOrCreateDiagramWidget(uri: URI): Promise<DiagramWidget> {
        return this.resolveApp.then(app => {
            const widget = this.widgetRegistry.getWidget(uri, this.diagramType)
            if (widget !== undefined)
                return widget as Promise<DiagramWidget>
            const widgetId = this.widgetRegistry.nextId()
            const svgContainerId = widgetId + '_sprotty'
            const newServer = this.createDiagramServer(widgetId, svgContainerId)
            const newWidget = new DiagramWidget(widgetId, svgContainerId, uri, this.diagramType, newServer)
            newWidget.title.closable = true
            newWidget.title.label = uri.path.base
            newWidget.title.icon = this.iconClass
            this.widgetRegistry.addWidget(uri, this.diagramType, newWidget)
            newWidget.disposed.connect(() => {
                this.widgetRegistry.removeWidget(uri, this.diagramType)
                this.diagramConnector.disconnect(newServer)
            })
            app.shell.addToMainArea(newWidget)
            return newWidget
        })
    }

    protected createDiagramServer(widgetId: string, svgContainerId: string): TheiaDiagramServer {
        const diagramConfiguration = this.diagramConfigurationRegistry.get(this.diagramType)
        const newServer = diagramConfiguration.createContainer(svgContainerId).get<TheiaDiagramServer>(TYPES.ModelSource)
        newServer.clientId = widgetId
        this.diagramConnector.connect(newServer)
        return newServer
    }
}

