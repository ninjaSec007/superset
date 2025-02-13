/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { lazy } from 'react';

// not lazy loaded since this is the home page.
import Welcome from 'src/views/CRUD/welcome/Welcome';

const ExtentedSliceContainer = lazy(
  () =>
    import(
      /* webpackChunkName: "ExtendedSliceContainer.tsx" */ 'src/addSlice/ExtendedSliceContainer'
    ),
);
const AnnotationLayersList = lazy(
  () =>
    import(
      /* webpackChunkName: "AnnotationLayersList" */ 'src/views/CRUD/annotationlayers/AnnotationLayersList'
    ),
);
const AlertList = lazy(
  () =>
    import(
      /* webpackChunkName: "AlertList" */ 'src/views/CRUD/alert/AlertList'
    ),
);
const AnnotationList = lazy(
  () =>
    import(
      /* webpackChunkName: "AnnotationList" */ 'src/views/CRUD/annotation/AnnotationList'
    ),
);
const ChartList = lazy(
  () =>
    import(
      /* webpackChunkName: "ChartList" */ 'src/views/CRUD/chart/ChartList'
    ),
);
const FlashList = lazy(
  () =>
    import(
      /* webpackChunkName: "FlashList" */ 'src/views/CRUD/flash/components/FlashGrid/FlashList'
    ),
);
const CssTemplatesList = lazy(
  () =>
    import(
      /* webpackChunkName: "CssTemplatesList" */ 'src/views/CRUD/csstemplates/CssTemplatesList'
    ),
);
const DashboardList = lazy(
  () =>
    import(
      /* webpackChunkName: "DashboardList" */ 'src/views/CRUD/dashboard/DashboardList'
    ),
);
const DashboardRoute = lazy(
  () =>
    import(
      /* webpackChunkName: "DashboardRoute" */ 'src/dashboard/containers/DashboardRoute'
    ),
);
const DatabaseList = lazy(
  () =>
    import(
      /* webpackChunkName: "DatabaseList" */ 'src/views/CRUD/data/database/DatabaseList'
    ),
);
const DatasetList = lazy(
  () =>
    import(
      /* webpackChunkName: "DatasetList" */ 'src/views/CRUD/data/dataset/DatasetList'
    ),
);

const AddDataset = lazy(
  () =>
    import(
      /* webpackChunkName: "DatasetEditor" */ 'src/views/CRUD/data/dataset/AddDataset/index'
    ),
);

const ExecutionLog = lazy(
  () =>
    import(
      /* webpackChunkName: "ExecutionLog" */ 'src/views/CRUD/alert/ExecutionLog'
    ),
);

const FlashAuditLogs = lazy(
  () =>
    import(
      /* webpackChunkName: "ExecutionLog" */ 'src/views/CRUD/flash/components/FlashAuditLogs/FlashAuditLogs'
    ),
);

const ExplorePage = lazy(
  () => import(/* webpackChunkName: "ExplorePage" */ 'src/explore/ExplorePage'),
);
const QueryList = lazy(
  () =>
    import(
      /* webpackChunkName: "QueryList" */ 'src/views/CRUD/data/query/QueryList'
    ),
);
const SavedQueryList = lazy(
  () =>
    import(
      /* webpackChunkName: "SavedQueryList" */ 'src/views/CRUD/data/savedquery/SavedQueryList'
    ),
);

type Routes = {
  path: string;
  Component: React.ComponentType;
  Fallback?: React.ComponentType;
  props?: React.ComponentProps<any>;
}[];

export const routes: Routes = [
  {
    path: '/superset/welcome/',
    Component: Welcome,
  },
  {
    path: '/dashboard/list/',
    Component: DashboardList,
  },
  {
    path: '/superset/dashboard/:idOrSlug/',
    Component: DashboardRoute,
  },
  {
    path: '/chart/add',
    Component: ExtentedSliceContainer,
  },
  {
    path: '/chart/list/',
    Component: ChartList,
  },
  {
    path: '/flash/list/',
    Component: FlashList,
  },
  {
    path: '/tablemodelview/list/',
    Component: DatasetList,
  },
  {
    path: '/databaseview/list/',
    Component: DatabaseList,
  },
  {
    path: '/savedqueryview/list/',
    Component: SavedQueryList,
  },
  {
    path: '/csstemplatemodelview/list/',
    Component: CssTemplatesList,
  },
  {
    path: '/annotationlayermodelview/list/',
    Component: AnnotationLayersList,
  },
  {
    path: '/annotationmodelview/:annotationLayerId/annotation/',
    Component: AnnotationList,
  },
  {
    path: '/superset/sqllab/history/',
    Component: QueryList,
  },
  {
    path: '/alert/list/',
    Component: AlertList,
  },
  {
    path: '/report/list/',
    Component: AlertList,
    props: {
      isReportEnabled: true,
    },
  },
  {
    path: '/alert/:alertId/log/',
    Component: ExecutionLog,
  },
  {
    path: '/report/:alertId/log/',
    Component: ExecutionLog,
    props: {
      isReportEnabled: true,
    },
  },
  {
    path: '/flash/auditlogs/:flashId/',
    Component: FlashAuditLogs,
  },
  {
    path: '/explore/',
    Component: ExplorePage,
  },
  {
    path: '/superset/explore/p',
    Component: ExplorePage,
  },
  {
    path: '/dataset/add/',
    Component: AddDataset,
  },
  {
    path: '/dataset/:datasetId',
    Component: AddDataset,
  },
];

const frontEndRoutes = routes
  .map(r => r.path)
  .reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: true,
    }),
    {},
  );

export function isFrontendRoute(path?: string) {
  if (path) {
    const basePath = path.split(/[?#]/)[0]; // strip out query params and link bookmarks
    return !!frontEndRoutes[basePath];
  }
  return false;
}
