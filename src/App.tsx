import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'

type Recipe = {
  id: number; name: string; image: string; cuisine: string; difficulty: string
  prepTimeMinutes: number; cookTimeMinutes: number; servings: number; caloriesPerServing: number
  ingredients: string[]; instructions: string[]; mealType: string[]; tags: string[]; rating: number
}
type RecipeResponse = { recipes: Recipe[]; total: number; skip: number; limit: number }

const API = 'https://dummyjson.com/recipes'

function Header() {
  return <header className="site-header"><Link className="brand" to="/" aria-label="Receitário, início"><span className="brand-mark">R</span><span>receitário<span className="brand-dot">.</span></span></Link><span className="header-note">cozinhar também é cuidado</span></header>
}
function Footer() { return <footer className="site-footer"><span>Feito com carinho e uma pitada de curiosidade.</span><span>RECEITÁRIO · 2026</span></footer> }
function Layout({ children }: { children: React.ReactNode }) { return <div className="app-shell"><Header /><main>{children}</main><Footer /></div> }
function Loading() { return <div className="status"><span className="spinner"/><p>Preparando a mesa...</p></div> }
function ErrorMessage({ children }: { children: React.ReactNode }) { return <div className="status error-state"><span className="status-icon">!</span><h2>Ops, algo saiu do forno errado.</h2><p>{children}</p><Link className="button button-dark" to="/">Voltar ao catálogo</Link></div> }

function Catalog() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [favorites, setFavorites] = useState<number[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API}?limit=0`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Não foi possível carregar as receitas.'); return response.json() as Promise<RecipeResponse> })
      .then(data => setRecipes(data.recipes))
      .catch(reason => { if (reason instanceof Error && reason.name !== 'AbortError') setError(reason.message) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const cuisines = useMemo(() => [...new Set(recipes.map(recipe => recipe.cuisine))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [recipes])
  const visibleRecipes = useMemo(() => recipes.filter(recipe => recipe.name.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')) && (!cuisine || recipe.cuisine === cuisine)), [recipes, query, cuisine])
  const toggleFavorite = (id: number) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])

  if (loading) return <Loading />
  if (error) return <ErrorMessage>{error} Confira sua conexão e tente novamente.</ErrorMessage>

  return <>
    <section className="hero"><div className="hero-copy"><span className="eyebrow">SEU PRÓXIMO PRATO FAVORITO</span><h1>Ideias gostosas<br/>para <em>todos os dias.</em></h1><p>Um catálogo para descobrir sabores do mundo e encontrar inspiração para a próxima refeição.</p></div><div className="hero-art" aria-hidden="true"><span className="hero-sun"/><span className="hero-leaf leaf-one">✳</span><span className="hero-leaf leaf-two">✳</span><span className="hero-label">feito para<br/>abrir o apetite</span></div></section>
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="section-heading"><div><span className="eyebrow">A COLEÇÃO</span><h2 id="catalog-title">O que vamos cozinhar?</h2></div><div className="favorite-count"><span aria-hidden="true">♡</span> {favorites.length} {favorites.length === 1 ? 'favorita' : 'favoritas'}</div></div>
      <div className="filters"><label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar receita pelo nome..." aria-label="Buscar receita pelo nome"/><kbd>⌘ K</kbd></label><label className="select-wrap"><span className="sr-only">Filtrar por culinária</span><select value={cuisine} onChange={event => setCuisine(event.target.value)}><option value="">Todas as culinárias</option>{cuisines.map(item => <option key={item} value={item}>{item}</option>)}</select></label></div>
      <p className="results-line">{visibleRecipes.length} {visibleRecipes.length === 1 ? 'receita encontrada' : 'receitas encontradas'}</p>
      {visibleRecipes.length ? <div className="recipe-grid">{visibleRecipes.map(recipe => <article className="recipe-card" key={recipe.id}><Link to={`/receitas/${recipe.id}`} className="card-image-link" aria-label={`Ver receita: ${recipe.name}`}><img className="card-image" src={recipe.image} alt={recipe.name} loading="lazy"/><span className="card-cuisine">{recipe.cuisine}</span></Link><button className={`favorite-button ${favorites.includes(recipe.id) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(recipe.id)} aria-label={favorites.includes(recipe.id) ? `Remover ${recipe.name} das favoritas` : `Adicionar ${recipe.name} às favoritas`} aria-pressed={favorites.includes(recipe.id)}>{favorites.includes(recipe.id) ? '♥' : '♡'}</button><div className="card-body"><span className="card-meta">{recipe.difficulty} <span>·</span> {recipe.mealType[0] ?? 'Receita'}</span><Link to={`/receitas/${recipe.id}`} className="card-title">{recipe.name}</Link><div className="card-bottom"><span>◷ {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span><span className="card-rating">★ {recipe.rating.toFixed(1)}</span></div></div></article>)}</div> : <div className="empty-state"><span>⌕</span><h3>Nenhuma receita por aqui</h3><p>Tente mudar a busca ou escolher outra culinária.</p><button className="text-button" onClick={() => { setQuery(''); setCuisine('') }}>Limpar filtros</button></div>}
    </section>
  </>
}

function RecipeDetail() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setRecipe(null); setNotFound(false)
    fetch(`${API}/${id}`, { signal: controller.signal }).then(response => {
      if (response.status === 404) { setNotFound(true); return null }
      if (!response.ok) throw new Error('Não foi possível carregar esta receita.')
      return response.json() as Promise<Recipe>
    }).then(data => { if (data) setRecipe(data) }).catch(reason => { if (reason instanceof Error && reason.name !== 'AbortError') setNotFound(true) }).finally(() => setLoading(false))
    return () => controller.abort()
  }, [id])
  if (loading) return <Loading />
  if (!recipe) return <ErrorMessage>{notFound ? 'Esta receita não existe ou não está disponível.' : 'Não encontramos esta receita.'}</ErrorMessage>
  return <article className="detail-page"><Link className="back-link" to="/">← Voltar ao catálogo</Link><div className="detail-hero"><img src={recipe.image} alt={recipe.name}/><div className="detail-intro"><span className="eyebrow">{recipe.cuisine.toUpperCase()} · {recipe.mealType.join(' / ').toUpperCase()}</span><h1>{recipe.name}</h1><p className="detail-description">Uma receita especial para trazer novos sabores à sua mesa.</p><div className="detail-stats"><div><strong>{recipe.prepTimeMinutes + recipe.cookTimeMinutes}</strong><span>minutos total</span></div><div><strong>{recipe.prepTimeMinutes}</strong><span>preparo · min</span></div><div><strong>{recipe.cookTimeMinutes}</strong><span>cozimento · min</span></div><div><strong>{recipe.servings}</strong><span>porções</span></div><div><strong>{recipe.difficulty}</strong><span>dificuldade</span></div><div><strong>★ {recipe.rating.toFixed(1)}</strong><span>avaliação</span></div></div></div></div><div className="detail-content"><section className="ingredients"><span className="eyebrow">VAMOS SEPARAR</span><h2>Ingredientes</h2><ul>{recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}><span className="ingredient-check">✓</span>{ingredient}</li>)}</ul><p className="servings-note">Para {recipe.servings} porções · {recipe.caloriesPerServing} kcal por porção</p></section><section className="instructions"><span className="eyebrow">PASSO A PASSO</span><h2>Modo de preparo</h2><ol>{recipe.instructions.map((instruction, index) => <li key={`${instruction}-${index}`}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><p>{instruction}</p></li>)}</ol></section></div></article>
}
function NotFound() { return <div className="not-found"><span className="not-found-code">404</span><span className="eyebrow">PÁGINA NÃO ENCONTRADA</span><h1>Essa página saiu<br/><em>do nosso cardápio.</em></h1><p>Mas ainda há muitas receitas esperando por você.</p><Link className="button button-dark" to="/">Ir para o catálogo <span>→</span></Link></div> }
export default function App() { return <Layout><Routes><Route path="/" element={<Catalog/>}/><Route path="/receitas/:id" element={<RecipeDetail/>}/><Route path="*" element={<NotFound/>}/></Routes></Layout> }
