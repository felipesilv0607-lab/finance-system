import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Dialog';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Field';
import Icon from '../components/ui/Icon';
import IconButton from '../components/ui/IconButton';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/toast-context';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../services/categoriesService';

// Rótulo, ícone e tom visual de cada tipo de categoria.
const CATEGORY_TYPES = {
  EXPENSE: { label: 'Despesa', group: 'Despesas', icon: 'trending-down', tone: 'danger' },
  INCOME: { label: 'Receita', group: 'Receitas', icon: 'trending-up', tone: 'success' },
};

// Ordem dos grupos na lista (a mesma do seletor de tipo).
const TYPE_ORDER = ['EXPENSE', 'INCOME'];

const NAME_FIELD_ID = 'category-name';

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function focusNameField() {
  const field = document.getElementById(NAME_FIELD_ID);

  // 'auto' = rolagem instantânea (nenhum CSS define scroll-behavior: smooth).
  field?.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
  field?.focus({ preventScroll: true });
}

function CategoryRow({ category, editing, busy, deleting, onEdit, onDelete }) {
  const type = CATEGORY_TYPES[category.type];

  return (
    <li className={`cat-row${editing ? ' is-editing' : ''}`}>
      <span className={`cat-row__icon cat-tone--${type?.tone ?? 'neutral'}`} aria-hidden="true">
        <Icon name={type?.icon ?? 'tag'} size={18} />
      </span>

      <div className="cat-row__identity">
        <span className="cat-row__name">{category.name}</span>
        {editing && (
          <Badge tone="primary" icon="edit">Em edição</Badge>
        )}
      </div>

      <div className="cat-row__actions">
        <IconButton
          icon="edit"
          label={`Editar categoria ${category.name}`}
          size="sm"
          onClick={() => onEdit(category)}
          disabled={busy || deleting}
        />
        <IconButton
          icon="trash"
          label={`Excluir categoria ${category.name}`}
          size="sm"
          tone="danger"
          onClick={() => onDelete(category)}
          disabled={busy || deleting}
        />
      </div>
    </li>
  );
}

function Categories() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setCategories(await getCategories());
      } catch (requestError) {
        console.error(requestError);
        setLoadError('Não foi possível carregar as categorias.');
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

        toast.success('Categoria atualizada', `"${updatedCategory.name}" foi salva.`);
      } else {
        const newCategory = await createCategory({ name, type });
        setCategories((currentCategories) => [...currentCategories, newCategory]);

        toast.success(
          'Categoria criada',
          loadError
            ? `"${newCategory.name}" foi salva. Recarregue a página para ver a lista completa.`
            : `"${newCategory.name}" já aparece na lista.`
        );
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
    focusNameField();
  }

  async function handleConfirmDelete() {
    const category = categoryToDelete;

    if (!category) return;

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

      toast.success('Categoria excluída', `"${category.name}" foi removida.`);
    } catch (requestError) {
      console.error(requestError);
      // Ex.: categoria usada por movimentações (409). O aviso aparece junto da
      // ação, e não no formulário, que pode estar sendo usado para outra categoria.
      toast.error('Não foi possível excluir a categoria', requestError.message);
    } finally {
      setDeletingId(null);
      setCategoryToDelete(null);
    }
  }

  // Sem a listagem completa, contagens e grupos seriam parciais (ou zero):
  // o resumo e a lista ficam indisponíveis até um carregamento bem-sucedido.
  const listUnavailable = Boolean(loadError);
  const groups = TYPE_ORDER.map((groupType) => ({
    type: groupType,
    ...CATEGORY_TYPES[groupType],
    items: categories.filter((category) => category.type === groupType),
  }));
  const totalCount = categories.length;

  function summaryValue(value) {
    return loading || listUnavailable ? '—' : value;
  }

  return (
    <AppLayout
      title="Categorias"
      description="Organize receitas e despesas para os próximos lançamentos."
    >
      <div className="cat" aria-busy={loading}>
        <section className="cat-hero" aria-label="Resumo das categorias">
          <div className="cat-hero__main">
            <span className="cat-hero__label">Categorias cadastradas</span>
            <strong className="cat-hero__value num">
              {loading || listUnavailable ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">{loading ? 'Carregando' : 'Indisponível'}</span>
                </>
              ) : (
                totalCount
              )}
            </strong>
            <span className="cat-hero__hint">
              {listUnavailable
                ? 'Indisponível: não foi possível carregar as categorias'
                : 'Usadas para classificar receitas e despesas'}
            </span>
          </div>

          <div className="cat-hero__stats">
            {groups.map((group) => (
              <div className="cat-hero__stat" key={group.type}>
                <span className="cat-hero__stat-value num">{summaryValue(group.items.length)}</span>
                <span className="cat-hero__stat-label">{group.group}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="cat-layout">
          <Card className={`cat-form-card${editingCategory ? ' is-editing' : ''}`}>
            <CardHeader
              eyebrow={editingCategory ? 'Edição' : 'Cadastro'}
              title={editingCategory ? 'Editar categoria' : 'Nova categoria'}
              subtitle={
                editingCategory
                  ? `Alterando "${editingCategory.name}".`
                  : 'Crie categorias para organizar seus lançamentos.'
              }
              headingLevel={2}
            />

            <form className="cat-form" onSubmit={handleSubmit}>
              <Input
                id={NAME_FIELD_ID}
                label="Nome da categoria"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Alimentação"
                minLength="2"
                maxLength="100"
                required
              />

              <Select
                id="category-type"
                label="Tipo"
                value={type}
                onChange={(event) => setType(event.target.value)}
                required
              >
                <option value="EXPENSE">Despesa</option>
                <option value="INCOME">Receita</option>
              </Select>

              {error && (
                <div className="cat-alert" role="alert">
                  <Icon name="alert-circle" size={18} />
                  <p>{error}</p>
                </div>
              )}

              <div className="cat-form__actions">
                <Button
                  type="submit"
                  icon={editingCategory ? 'check' : 'plus'}
                  loading={saving}
                >
                  {saving ? 'Salvando...' : editingCategory ? 'Salvar alterações' : 'Criar categoria'}
                </Button>

                {editingCategory && (
                  <Button variant="secondary" onClick={resetForm} disabled={saving}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <section className="cat-list" aria-labelledby="cat-list-title">
            <div className="cat-list__header">
              <h2 id="cat-list-title" className="cat-list__title">Suas categorias</h2>
              {!loading && !listUnavailable && totalCount > 0 && (
                <span className="cat-list__count">{totalCount}</span>
              )}
            </div>

            {loadError && (
              <div className="cat-alert" role="alert">
                <Icon name="alert-circle" size={18} />
                <p>{loadError}</p>
              </div>
            )}

            {loading && (
              <div className="cat-groups">
                {[0, 1].map((item) => (
                  <Skeleton key={item} height={168} radius="16px" />
                ))}
              </div>
            )}

            {!loading && !loadError && totalCount === 0 && (
              <Card>
                <EmptyState
                  icon="tag"
                  title="Nenhuma categoria cadastrada"
                  description="Crie uma categoria para organizar seus lançamentos."
                  action={
                    <Button variant="secondary" icon="plus" onClick={focusNameField}>
                      Criar categoria
                    </Button>
                  }
                />
              </Card>
            )}

            {!loading && !listUnavailable && totalCount > 0 && (
              <div className="cat-groups">
                {groups.map((group) => (
                  <Card
                    key={group.type}
                    padding="flush"
                    className="cat-group"
                    aria-labelledby={`cat-group-${group.type}`}
                  >
                    <div className="cat-group__header">
                      <span className={`cat-group__icon cat-tone--${group.tone}`} aria-hidden="true">
                        <Icon name={group.icon} size={16} />
                      </span>
                      <h3 id={`cat-group-${group.type}`} className="cat-group__title">
                        {group.group}
                      </h3>
                      <Badge tone={group.tone}>{group.items.length}</Badge>
                    </div>

                    {group.items.length === 0 ? (
                      <p className="cat-group__empty">
                        Nenhuma categoria de {group.label.toLowerCase()} cadastrada.
                      </p>
                    ) : (
                      <ul className="cat-rows">
                        {group.items.map((category) => (
                          <CategoryRow
                            key={category.id}
                            category={category}
                            editing={editingCategory?.id === category.id}
                            busy={saving}
                            deleting={deletingId === category.id}
                            onEdit={handleEdit}
                            onDelete={setCategoryToDelete}
                          />
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={categoryToDelete !== null}
        title="Excluir categoria?"
        description={
          categoryToDelete
            ? `Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir categoria"
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </AppLayout>
  );
}

export default Categories;
