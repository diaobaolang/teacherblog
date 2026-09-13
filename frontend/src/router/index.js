import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'articles',
        name: 'ArticleList',
        component: () => import('../views/ArticleList.vue')
      },
      {
        path: 'articles/:id',
        name: 'ArticleDetail',
        component: () => import('../views/ArticleDetail.vue')
      },
      {
        path: 'honor-wall',
        name: 'HonorWall',
        component: () => import('../views/HonorWall.vue')
      },
      {
        path: 'class-wall',
        name: 'ClassWall',
        component: () => import('../views/ClassWall.vue')
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('../views/Messages.vue')
      }
    ]
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/Login.vue')
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('../views/admin/ProfileManage.vue')
      },
      {
        path: 'honor-wall',
        name: 'AdminHonorWall',
        component: () => import('../views/admin/HonorWallManage.vue')
      },
      {
        path: 'class-wall',
        name: 'AdminClassWall',
        component: () => import('../views/admin/ClassWallManage.vue')
      },
      {
        path: 'articles',
        name: 'AdminArticles',
        component: () => import('../views/admin/ArticleManage.vue')
      },
      {
        path: 'articles/edit/:id?',
        name: 'AdminArticleEdit',
        component: () => import('../views/admin/ArticleEdit.vue')
      },
      {
        path: 'messages',
        name: 'AdminMessages',
        component: () => import('../views/admin/MessageManage.vue')
      }
    ],
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/admin/login')
  } else {
    next()
  }
})

export default router
