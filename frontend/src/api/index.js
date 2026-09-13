import request from './request'

// 个人介绍
export const getProfile = () => request.get('/profile')
export const updateProfile = (content) => request.put('/profile', { content })

// 荣誉墙
export const getHonorGroups = () => request.get('/honorwall/groups')
export const getGroupPhotos = (groupId) => request.get(`/honorwall/groups/${groupId}/photos`)
export const getAllHonorData = () => request.get('/honorwall/all')
export const createHonorGroup = (data) => request.post('/honorwall/groups', data)
export const updateHonorGroup = (id, data) => request.put(`/honorwall/groups/${id}`, data)
export const deleteHonorGroup = (id) => request.delete(`/honorwall/groups/${id}`)
export const sortHonorGroups = (items) => request.put('/honorwall/groups/sort', { items })
export const addPhoto = (groupId, data) => request.post(`/honorwall/groups/${groupId}/photos`, data)
export const updatePhoto = (id, data) => request.put(`/honorwall/photos/${id}`, data)
export const deletePhoto = (id) => request.delete(`/honorwall/photos/${id}`)
export const sortPhotos = (groupId, items) => request.put(`/honorwall/groups/${groupId}/photos/sort`, { items })

// 文章
export const getArticles = (params) => request.get('/articles', { params })
export const getArticle = (id) => request.get(`/articles/${id}`)
export const getAdminArticles = () => request.get('/articles/admin/list')
export const getAdminArticle = (id) => request.get(`/articles/admin/${id}`)
export const createArticle = (data) => request.post('/articles/admin', data)
export const updateArticle = (id, data) => request.put(`/articles/admin/${id}`, data)
export const deleteArticle = (id) => request.delete(`/articles/admin/${id}`)
export const sortArticles = (items) => request.put('/articles/admin/sort', { items })

// 留言
export const getMessages = () => request.get('/messages')
export const submitMessage = (data) => request.post('/messages', data)
export const getAdminMessages = () => request.get('/messages/admin/list')
export const reviewMessage = (id, status) => request.put(`/messages/admin/${id}/review`, { status })
export const deleteMessage = (id) => request.delete(`/messages/admin/${id}`)
export const sortMessages = (items) => request.put('/messages/admin/sort', { items })

// 认证
export const login = (data) => request.post('/auth/login', data)

// 图片上传
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
