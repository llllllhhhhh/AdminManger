const CACHE_NAME = 'xuetuxing-support-images-v1'
const DB_NAME = 'xuetuxing-image-cache'
const STORE_NAME = 'images'
const INDEX_KEY = 'xuetuxing-support-image-cache-index'
const CACHE_LIMIT = 100
const inFlight = new Set()

const readIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeIndex = index => localStorage.setItem(INDEX_KEY, JSON.stringify(index))

const touch = url => {
  const index = readIndex()
  index[url] = Date.now()
  writeIndex(index)
}

const openDb = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) return reject(new Error('indexedDB unavailable'))
  const request = indexedDB.open(DB_NAME, 1)
  request.onupgradeneeded = () => {
    const db = request.result
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const idbGet = async url => {
  try {
    const db = await openDb()
    return await new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const request = tx.objectStore(STORE_NAME).get(url)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

const idbSet = async (url, blob) => {
  try {
    const db = await openDb()
    await new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(blob, url)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch {}
}

const idbDelete = async url => {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(url)
  } catch {}
}

const prune = async cache => {
  const index = readIndex()
  const entries = Object.entries(index).sort((a, b) => b[1] - a[1])
  const removed = entries.slice(CACHE_LIMIT)
  if (!removed.length) return
  await Promise.allSettled(removed.map(([url]) => cache?.delete ? cache.delete(url) : idbDelete(url)))
  removed.forEach(([url]) => delete index[url])
  writeIndex(index)
}

const responseToObjectUrl = async response => URL.createObjectURL(await response.blob())

export const getCachedSupportImage = async url => {
  if (!url) return url
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME)
    const matched = await cache.match(url)
    if (!matched) return url
    touch(url)
    return responseToObjectUrl(matched)
  }
  const blob = await idbGet(url)
  if (!blob) return url
  touch(url)
  return URL.createObjectURL(blob)
}

export const cacheSupportImage = async (url, onReady) => {
  if (!url) return url
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME)
    const matched = await cache.match(url)
    if (matched) {
      touch(url)
      const localUrl = await responseToObjectUrl(matched)
      onReady?.(localUrl)
      return localUrl
    }
  } else {
    const blob = await idbGet(url)
    if (blob) {
      touch(url)
      const localUrl = URL.createObjectURL(blob)
      onReady?.(localUrl)
      return localUrl
    }
  }

  if (inFlight.has(url)) return url
  inFlight.add(url)
  try {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) return url
    let localUrl = url
    if ('caches' in window) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(url, response.clone())
      await prune(cache)
      localUrl = await responseToObjectUrl(response)
    } else {
      const blob = await response.blob()
      await idbSet(url, blob)
      await prune(null)
      localUrl = URL.createObjectURL(blob)
    }
    touch(url)
    onReady?.(localUrl)
    return localUrl
  } catch {
    return url
  } finally {
    inFlight.delete(url)
  }
}
