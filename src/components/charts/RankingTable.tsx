import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@carbon/react';
import type { RankedReturn } from '../../domain';
import { formatPercent } from '../format';

interface Props {
  rows: RankedReturn[];
  label: (symbol: string) => string;
  caption: string;
}

export function RankingTable({ rows, label, caption }: Props) {
  return (
    <section className="ranking" aria-label={caption}>
      <h2 className="chart-card__title">{caption}</h2>
      <Table size="md" aria-label={caption}>
        <TableHead>
          <TableRow>
            <TableHeader>Rank</TableHeader>
            <TableHeader>Company</TableHeader>
            <TableHeader>Return</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.symbol}>
              <TableCell>{row.rank}</TableCell>
              <TableCell>{label(row.symbol)}</TableCell>
              <TableCell className={row.returnPercent >= 0 ? 'is-up' : 'is-down'}>
                {formatPercent(row.returnPercent)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
