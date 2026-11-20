import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { MainLayout } from '../layouts/MainLayout'
import { AdminBoardsPage } from '../pages/admin/AdminBoardsPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { SignupPage } from '../pages/auth/SignupPage'
import { BoardListPage } from '../pages/board/BoardListPage'
import { PostDetailPage } from '../pages/board/PostDetailPage'
import { PostEditPage } from '../pages/board/PostEditPage'
import { MyPage } from '../pages/mypage/MyPage'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<BoardListPage />} />
        <Route path="/board" element={<BoardListPage />} />
        <Route path="/boards/:boardCode" element={<BoardListPage />} />
        <Route path="/board/write" element={<PostEditPage />} />
        <Route path="/board/:postId" element={<PostDetailPage />} />
        <Route path="/board/:postId/edit" element={<PostEditPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="boards" element={<AdminBoardsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
