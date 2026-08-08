import type { Product } from '../types/inventory'

interface Props { products: Product[]; selectedId?: number; onSelect: (p: Product) => void; onChangeQty: (id: number, qty: number) => void }

export function ProductTable({ products, selectedId, onSelect, onChangeQty }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Estado</th><th>Producto</th><th>Proveedor</th><th>Formato</th><th>Sugerido AI</th><th>Confianza</th><th></th></tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={selectedId === p.id ? 'selected' : ''} onClick={() => onSelect(p)}>
              <td><span className={`status ${p.status.toLowerCase()}`}>{p.status === 'ALERT' ? 'Alerta' : 'Estable'}</span></td>
              <td><strong>{p.name}</strong><small>{p.category} · {p.sku}</small></td>
              <td>{p.provider}</td><td>{p.format}</td>
              <td onClick={e => e.stopPropagation()}><input className="qty" type="number" min="0" value={p.quantity} onChange={e => onChangeQty(p.id, Number(e.target.value))}/>{p.unit}</td>
              <td><div className="confidence"><span style={{width:`${p.confidence}%`}}/></div><small>{p.confidence}%</small></td>
              <td><button className="ghost" onClick={() => onSelect(p)}>Analizar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
