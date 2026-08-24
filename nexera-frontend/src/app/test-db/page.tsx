import { createClient } from '@/utils/supabase/server'

export default async function TestDbPage() {
  const supabase = await createClient()

  // Thử truy vấn danh sách categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')

  // Thử truy vấn danh sách products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')

  // Thử truy vấn danh sách articles
  const { data: articles, error: artError } = await supabase
    .from('articles')
    .select('*')

  const connectionOk = !catError && !prodError && !artError

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        🔌 Test kết nối Supabase
      </h1>

      <div style={{
        padding: '1rem',
        borderRadius: 8,
        background: connectionOk ? '#e6ffe6' : '#ffe6e6',
        border: `2px solid ${connectionOk ? '#80bf49' : '#e74c3c'}`,
        marginBottom: '1.5rem'
      }}>
        <strong>{connectionOk ? '✅ Kết nối thành công!' : '❌ Có lỗi kết nối'}</strong>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📂 categories</h2>
      {catError
        ? <pre style={{ color: 'red' }}>Lỗi: {catError.message}</pre>
        : <p>Truy vấn thành công — {categories?.length ?? 0} bản ghi</p>
      }

      <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', marginTop: '1rem' }}>📦 products</h2>
      {prodError
        ? <pre style={{ color: 'red' }}>Lỗi: {prodError.message}</pre>
        : <p>Truy vấn thành công — {products?.length ?? 0} bản ghi</p>
      }

      <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', marginTop: '1rem' }}>📰 articles</h2>
      {artError
        ? <pre style={{ color: 'red' }}>Lỗi: {artError.message}</pre>
        : <p>Truy vấn thành công — {articles?.length ?? 0} bản ghi</p>
      }

      <p style={{ marginTop: '2rem', color: '#888', fontSize: '0.85rem' }}>
        Trang này chỉ dùng để kiểm tra kết nối. Có thể xoá sau khi xác nhận thành công.
      </p>
    </div>
  )
}
