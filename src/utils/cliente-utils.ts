import { Repository } from 'typeorm';

/**
 * Obtiene los IDs del cliente actual y sus hijos (excluyendo al padre del cliente actual)
 * @param clienteRepository - Repositorio de TypeORM para ejecutar queries
 * @param cliente - ID del cliente actual
 * @returns Objeto con los IDs filtrados (cliente actual + hijos, sin el padre) y placeholders para usar en queries SQL
 */
export async function getClienteHijos(
  clienteRepository: Repository<any>,
  cliente: number,
): Promise<{ ids: number[]; placeholders: string }> {
  // Primero obtener el idPadre del cliente actual para excluirlo
  const clienteActual = await clienteRepository.query(
    `SELECT IdPadre FROM Clientes WHERE Id = ?`,
    [cliente],
  );
  
  const idPadre = clienteActual[0]?.IdPadre ? Number(clienteActual[0].IdPadre) : null;

  // Obtener el cliente y sus hijos usando el stored procedure
  const clientesFiltrado = await clienteRepository.query(
    `CALL spGetClientes(?);`,
    [cliente],
  );

  const idsFiltrados = clientesFiltrado[0]; // El primer índice contiene los resultados
  const ids = idsFiltrados
    .map((clientesFiltrado: any) => Number(clientesFiltrado.Id))
    .filter(id => !isNaN(id) && (idPadre === null || id !== idPadre)); // Excluir al padre si existe
  
  if (ids.length === 0) {
    return { ids: [], placeholders: '' }; // No hay clientes que consultar
  }

  // Construir el query dinámico con los IDs
  const placeholders = ids.map(() => '?').join(', ');
  return { ids, placeholders };
}

/**
 * Obtiene los IDs del cliente actual y sus hijos (excluyendo al padre del cliente actual)
 * Útil para paginación donde solo se quiere el cliente actual y sus descendientes, sin incluir al padre
 * @param clienteRepository - Repositorio de TypeORM para ejecutar queries
 * @param cliente - ID del cliente actual
 * @returns Objeto con los IDs filtrados (cliente actual + hijos, sin el padre) y placeholders para usar en queries SQL
 */
export async function getClienteHijosPag(
  clienteRepository: Repository<any>,
  cliente: number,
): Promise<{ ids: number[]; placeholders: string }> {
  // Primero obtener el idPadre del cliente actual para excluirlo
  const clienteActual = await clienteRepository.query(
    `SELECT IdPadre FROM Clientes WHERE Id = ?`,
    [cliente],
  );
  
  const idPadre = clienteActual[0]?.IdPadre ? Number(clienteActual[0].IdPadre) : null;

  // Obtener el cliente y sus hijos usando el stored procedure
  const result = await clienteRepository.query(
    'CALL spGetClientes(?);',
    [cliente],
  );

  let rows = result?.[0] ?? [];

  // Construir ids incluyendo el cliente actual y sus hijos, pero excluyendo al padre
  const ids = rows
    .map((row: any) => Number(row.Id))
    .filter(id => !isNaN(id) && (idPadre === null || id !== idPadre)); // Excluir al padre si existe

  if (ids.length === 0) {
    return { ids: [], placeholders: '' };
  }

  const placeholders = ids.map(() => '?').join(', ');

  return { ids, placeholders };
}

