import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";

const PostPage = lazy(() => import("./PostPage"));
const TagPage = lazy(() => import("./pages/TagPage"));
const ArtPage = lazy(() => import("./pages/ArtPage"));
const ArtworkDetailPage = lazy(() => import("./pages/ArtworkDetailPage"));
const ArtworkTagPage = lazy(() => import("./pages/ArtworkTagPage"));

function App() {
  return (
    <Suspense fallback={<div className="route-loading">Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/art" element={<ArtPage />} />
        <Route path="/art/tag/:tagName" element={<ArtworkTagPage />} />
        <Route path="/art/:slug" element={<ArtworkDetailPage />} />
        <Route path="/post/:slug" element={<PostPage />} />
        <Route path="/tag/:tagName" element={<TagPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
