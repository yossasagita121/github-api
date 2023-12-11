import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./App.css"
import "./bootstrap/css/bootstrap.min.css"
import Index from "./components"
import Repos from "./components/repos"
import Repo from "./components/repo"
import Error from "./components/error"
import Commits from "./components/commits"
import Statistic from "./components/statistic"
import Rank from "./components/rank"
export default function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Index />,
    },
    {
      path: "/repos/:username",
      element: <Repos />,
    },
    {
      path: "/repos/:username/error",
      element: <Error />,
    },
    {
      path: "/repo/:username/:name",
      element: <Repo />,
    },
    {
      path: "/commits/:username/:name/:login",
      element: <Commits />,
    },
    {
      path: "/statistic/:username/:name",
      element: <Statistic />
    },
    {
      path: "/rank/:username/:name",
      element: <Rank />
    }
  ])

  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}