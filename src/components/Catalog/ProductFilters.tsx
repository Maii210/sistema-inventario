import { useApp } from "../../contexts/AppContext";

export function ProductFilters() {
  const { state, dispatch } = useApp();

  const handleCheckboxChange = (filterKey: keyof typeof state.filters, value: string) => {
    const currentValues = state.filters[filterKey] as string[] | undefined;
    const updatedValues = currentValues?.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...(currentValues || []), value];

    dispatch({
      type: "SET_FILTERS",
      payload: {
        ...state.filters,
        [filterKey]: updatedValues,
      },
    });
  };

  const categories = ["floral", "cítrica", "amaderada", "oriental"];
  const genders = ["masculino", "femenino", "unisex"];
  const brands = ["Chanel", "Dior", "Versace", "Calvin Klein"];
  const durations = ["corta", "media", "larga"];
  const intensities = ["suave", "moderada", "intensa"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-essence-navy">Filtros</h2>

      {/* Categoría */}
      <div>
        <h3 className="font-semibold mb-2">Categoría</h3>
        {categories.map(category => (
          <label key={category} className="block text-sm">
            <input
              type="checkbox"
              checked={state.filters.category?.includes(category) || false}
              onChange={() => handleCheckboxChange("category", category)}
              className="mr-2"
            />
            {category}
          </label>
        ))}
      </div>

      {/* Género */}
      <div>
        <h3 className="font-semibold mb-2">Género</h3>
        {genders.map(gender => (
          <label key={gender} className="block text-sm">
            <input
              type="checkbox"
              checked={state.filters.gender?.includes(gender) || false}
              onChange={() => handleCheckboxChange("gender", gender)}
              className="mr-2"
            />
            {gender}
          </label>
        ))}
      </div>

      {/* Marca */}
      <div>
        <h3 className="font-semibold mb-2">Marca</h3>
        {brands.map(brand => (
          <label key={brand} className="block text-sm">
            <input
              type="checkbox"
              checked={state.filters.brand?.includes(brand) || false}
              onChange={() => handleCheckboxChange("brand", brand)}
              className="mr-2"
            />
            {brand}
          </label>
        ))}
      </div>

      {/* Intensidad */}
      <div>
        <h3 className="font-semibold mb-2">Intensidad</h3>
        {intensities.map(level => (
          <label key={level} className="block text-sm">
            <input
              type="checkbox"
              checked={state.filters.intensity?.includes(level) || false}
              onChange={() => handleCheckboxChange("intensity", level)}
              className="mr-2"
            />
            {level}
          </label>
        ))}
      </div>

      {/* Duración */}
      <div>
        <h3 className="font-semibold mb-2">Duración</h3>
        {durations.map(duration => (
          <label key={duration} className="block text-sm">
            <input
              type="checkbox"
              checked={state.filters.duration?.includes(duration) || false}
              onChange={() => handleCheckboxChange("duration", duration)}
              className="mr-2"
            />
            {duration}
          </label>
        ))}
      </div>

      {/* Precio */}
      <div>
        <h3 className="font-semibold mb-2">Rango de Precio</h3>
        <input
          type="range"
          min={50}
          max={1000}
          step={10}
          value={state.filters.priceRange?.[1] || 1000}
          onChange={(e) => {
            const max = parseInt(e.target.value, 10);
            dispatch({
              type: "SET_FILTERS",
              payload: {
                ...state.filters,
                priceRange: [0, max],
              },
            });
          }}
          className="w-full"
        />
        <p className="text-sm text-gray-600 mt-1">
          Hasta {state.filters.priceRange?.[1] || 1000} BOB
        </p>
      </div>
    </div>
  );
}
