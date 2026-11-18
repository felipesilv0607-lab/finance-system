import { useState } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import Dialog, { ConfirmDialog } from '../components/ui/Dialog';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Field';
import Icon from '../components/ui/Icon';
import { iconNames } from '../components/ui/icons';
import IconButton from '../components/ui/IconButton';
import Skeleton from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/toast-context';
import './UiKit.css';

const swatches = [
  ['primary', ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']],
  ['neutral', ['0', '50', '100', '200', '300', '400', '500', '700', '900', '950']],
  ['success', ['50', '200', '500', '700']],
  ['danger', ['50', '200', '500', '700', '800']],
  ['warning', ['50', '200', '500', '700']],
  ['info', ['50', '200', '500', '700']],
];

const typeScale = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];

function Section({ title, children }) {
  return (
    <section className="uikit__section">
      <h2 className="uikit__h2">{title}</h2>
      {children}
    </section>
  );
}

function UiKit() {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <main className="uikit">
      <h1 className="uikit__h1">Design system — Finance System</h1>
      <p className="uikit__lead">
        Catálogo interno de componentes (visível apenas em desenvolvimento).
      </p>

      <Section title="Cores">
        {swatches.map(([name, steps]) => (
          <div className="uikit__row" key={name}>
            <span className="uikit__label">{name}</span>
            {steps.map((step) => (
              <span
                key={step}
                className="uikit__swatch"
                style={{ background: `var(--color-${name}-${step})` }}
                title={`${name}-${step}`}
              >
                {step}
              </span>
            ))}
          </div>
        ))}
      </Section>

      <Section title="Tipografia">
        {typeScale.map((size) => (
          <p key={size} className="uikit__type" style={{ fontSize: `var(--fs-${size})` }}>
            <span className="uikit__label">{size}</span>
            Seu dinheiro, sob controle —{' '}
            <span className="num">R$ 1.234.567,89</span>
          </p>
        ))}
      </Section>

      <Section title="Botões">
        <div className="uikit__row">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Fantasma</Button>
          <Button variant="danger">Excluir</Button>
          <Button icon="plus">Com ícone</Button>
          <Button loading>Salvando</Button>
          <Button disabled>Desabilitado</Button>
        </div>
        <div className="uikit__row">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
          <IconButton icon="edit" label="Editar" />
          <IconButton icon="trash" label="Excluir" tone="danger" />
          <IconButton icon="eye" label="Visualizar" size="sm" />
        </div>
      </Section>

      <Section title="Campos">
        <div className="uikit__grid">
          <Input label="Nome da conta" placeholder="Ex.: Conta principal" hint="Como a conta aparece nas listas." />
          <Input label="Valor" prefix="R$" placeholder="0,00" inputMode="decimal" required />
          <Input label="Com erro" defaultValue="x" error="Informe ao menos 2 caracteres." />
          <Input label="Desabilitado" defaultValue="Somente leitura" disabled />
          <Select label="Tipo de conta" defaultValue="">
            <option value="" disabled>Selecione o tipo</option>
            <option value="BANK">Conta bancária</option>
            <option value="CASH">Dinheiro</option>
          </Select>
        </div>
      </Section>

      <Section title="Badges">
        <div className="uikit__row">
          <Badge>Neutro</Badge>
          <Badge tone="primary">Primário</Badge>
          <Badge tone="success" icon="arrow-down-left">Receita</Badge>
          <Badge tone="danger" icon="arrow-up-right">Despesa</Badge>
          <Badge tone="warning" dot>Atenção</Badge>
          <Badge tone="info">Info</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="uikit__grid">
          <Card>
            <CardHeader eyebrow="Resumo" title="Card padrão" subtitle="Subtítulo de apoio" actions={<IconButton icon="more-horizontal" label="Mais ações" size="sm" />} />
            <p>Conteúdo do card com espaçamento padrão.</p>
          </Card>
          <Card interactive padding="sm">
            <CardHeader title="Card interativo" headingLevel={3} />
            <p>Realça ao passar o mouse.</p>
          </Card>
        </div>
      </Section>

      <Section title="Estados">
        <div className="uikit__grid">
          <Card aria-busy="true">
            <Skeleton width="40%" height={14} />
            <div style={{ height: 12 }} />
            <Skeleton height={32} />
            <div style={{ height: 12 }} />
            <Skeleton width="70%" height={14} />
          </Card>
          <Card padding="flush">
            <EmptyState
              icon="transactions"
              title="Nenhuma movimentação"
              description="Quando você registrar receitas ou despesas, elas aparecerão aqui."
              action={<Button icon="plus">Nova movimentação</Button>}
            />
          </Card>
          <Card>
            <div className="uikit__row">
              <Spinner label="Carregando" />
              <Spinner size="lg" label="Carregando" />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Sobreposições e feedback">
        <div className="uikit__row">
          <Button variant="secondary" onClick={() => setDialog(true)}>Abrir diálogo</Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>Confirmar exclusão</Button>
          <Button variant="secondary" onClick={() => toast.success('Conta criada', 'Sua conta já aparece na lista.')}>Toast sucesso</Button>
          <Button variant="secondary" onClick={() => toast.error('Não foi possível salvar', 'Tente novamente em instantes.')}>Toast erro</Button>
          <Button variant="secondary" onClick={() => toast.info('Dica', 'Use os filtros para refinar a lista.')}>Toast info</Button>
        </div>
      </Section>

      <Section title={`Ícones (${iconNames.length})`}>
        <div className="uikit__icons">
          {iconNames.map((name) => (
            <div className="uikit__icon" key={name}>
              <Icon name={name} size={22} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Nova conta"
        description="Preencha os dados para cadastrar uma conta."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button onClick={() => setDialog(false)}>Salvar</Button>
          </>
        }
      >
        <div className="uikit__grid uikit__grid--one">
          <Input label="Nome" placeholder="Ex.: Reserva" />
          <Select label="Tipo" defaultValue="BANK">
            <option value="BANK">Conta bancária</option>
            <option value="CASH">Dinheiro</option>
          </Select>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirm}
        title="Excluir conta?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onCancel={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
      />
    </main>
  );
}

export default UiKit;
