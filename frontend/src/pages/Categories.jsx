import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../services/categoriesService';

const typeLabels = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setCategories(await getCategories());
      } catch (requestError) {
        console.error(requestError);
        setError('Não foi possível carregar as categorias.');
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  function resetForm() {
    setName('');
    setType('EXPENSE');
    setEditingCategory(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingCategory) {
        const updatedCategory = await updateCategory(editingCategory.id, { name, type });
        setCategories((currentCategories) => currentCategories.map((category) => (
          category.id === updatedCategory.id ? updatedCategory : category
        )));
      } else {
        const newCategory = await createCategory({ name, type });
        setCategories((currentCategories) => [...currentCategories, newCategory]);
      }

      resetForm();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(category) {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setError('');
  }

  async function handleDelete(category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return;

    setDeletingId(category.id);
    setError('');

    try {
      await deleteCategory(category.id);
      setCategories((currentCategories) => currentCategories.filter(
        (currentCategory) => currentCategory.id !== category.id
      ));

      if (editingCategory?.id === category.id) {
        resetForm();
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout title="Categorias" section="FINANÇAS">
      <section className="dashboard">
        <div className="dashboard-welcome">
          <span>FINANÇAS</span>
          <h2>Minhas categorias</h2>
          <p>Organize receitas e despesas para os próximos lançamentos.</p>
        </div>

        <section className="dashboard-section category-form-section">
          <div className="section-heading">
            <div>
              <span>{editingCategory ? 'EDIÇÃO' : 'CADASTRO'}</span>
              <h3>{editingCategory ? 'Editar categoria' : 'Nova categoria'}</h3>
            </div>
          </div>

          <form className="category-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="category-name">Nome da categoria</label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Alimentação"
                minLength="2"
                maxLength="100"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="category-type">Tipo</label>
              <select
                id="category-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                required
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </select>
            </div>

            <div className="category-form-actions">
              <button className="account-submit-button" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingCategory ? 'Salvar alterações' : 'Criar categoria'}
              </button>

              {editingCategory && (
                <button className="category-cancel-button" type="button" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {loading && <div className="dashboard-section"><p>Carregando categorias...</p></div>}
        {error && <div className="dashboard-section"><p>{error}</p></div>}

        {!loading && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span>LISTA</span>
                <h3>Categorias cadastradas</h3>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="empty-state">
                <h4>Nenhuma categoria cadastrada</h4>
                <p>Crie uma categoria para organizar seus lançamentos.</p>
              </div>
            ) : (
              <div className="categories-list">
                {categories.map((category) => (
                  <article className="category-row" key={category.id}>
                    <div>
                      <span className={`category-type category-type-${category.type.toLowerCase()}`}>
                        {typeLabels[category.type]}
                      </span>
                      <h4>{category.name}</h4>
                    </div>

                    <div className="category-actions">
                      <button type="button" onClick={() => handleEdit(category)}>Editar</button>
                      <button
                        className="category-delete-button"
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                      >
                        {deletingId === category.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </AppLayout>
  );
}

export default Categories;
