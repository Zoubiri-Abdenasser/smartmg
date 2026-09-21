import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import { LandingPage } from './routes/index'
import { AppLayout } from './components/layout/app-shell'
import { DashboardPage } from './routes/app/index'
import { InventoryPage } from './routes/app/inventory'
import { ForecastsPage } from './routes/app/forecasts'
import { PurchasePage } from './routes/app/purchase'
import { CalendarPage } from './routes/app/calendar'
import { SalesPage } from './routes/app/sales'
import { SuppliersPage } from './routes/app/suppliers'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: AppLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: DashboardPage,
})

const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inventory',
  component: InventoryPage,
})

const forecastsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/forecasts',
  component: ForecastsPage,
})

const purchaseRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/purchase',
  component: PurchasePage,
})

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/calendar',
  component: CalendarPage,
})

const salesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sales',
  component: SalesPage,
})

const suppliersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/suppliers',
  component: SuppliersPage,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  appRoute.addChildren([
    dashboardRoute,
    inventoryRoute,
    forecastsRoute,
    purchaseRoute,
    calendarRoute,
    salesRoute,
    suppliersRoute,
  ]),
])
