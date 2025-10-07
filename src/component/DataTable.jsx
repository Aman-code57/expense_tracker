import React from 'react';

const DataTable = ({
  data,
  columns,
  onEdit,
  onDelete,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  searchTerm,
  setSearchTerm,
  sortConfig,
  setSortConfig,
  tableClass = 'custom-tabled'
}) => {
  const filteredData = data.filter((item) =>
    columns.some((col) =>
      col.key !== 'actions' &&
      item[col.key]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    if (!columns.find(col => col.key === key)?.sortable) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  return (
    <>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-containers">
        <table className={tableClass}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  {col.label}{' '}
                  {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                  No data
                </td>
              </tr>
            ) : (
              currentData.map((item, idx) => (
                <tr key={item.id || idx}>
                  {columns.map((col, i) => (
                    <td key={i}>
                      {col.key === 'actions' ? (
                        <div className="actions">
                          <button className="btn-edit" onClick={() => onEdit(item)}>
                            Edit
                          </button>
                          <button className="btn-delete" onClick={() => onDelete(item.id)}>
                            Delete
                          </button>
                        </div>
                      ) : col.format ? (
                        col.format(item[col.key])
                      ) : (
                        item[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={currentPage === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default DataTable;
