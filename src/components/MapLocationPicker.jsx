import { useEffect, useRef, useState } from "react";

const MapLocationPicker = ({ value, onChange }) => {
  const [, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState(value?.label || "");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState(value || null);
  const mapContainerRef = useRef();
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window.L === "undefined") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      mapContainerRef.current.innerHTML = "";

      try {
        const startLatLng = value
          ? [value.lat, value.lng]
          : [-6.5976, 106.7996];

        const mapInstance = window.L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView(startLatLng, value ? 15 : 13);

        window.L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "",
          }
        ).addTo(mapInstance);

        if (value) {
          window.L.marker(startLatLng).addTo(mapInstance);
        }

        mapInstance.on("click", (e) => {
          const { lat, lng } = e.latlng;
          mapInstance.eachLayer((layer) => {
            if (layer instanceof window.L.Marker) {
              mapInstance.removeLayer(layer);
            }
          });
          window.L.marker([lat, lng]).addTo(mapInstance);
          setSelected({
            lat,
            lng,
            label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });

          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          )
            .then((res) => res.json())
            .then((data) => {
              const address =
                data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
              onChange({
                location: address,
                latitude: lat,
                longitude: lng,
              });
              setSelected({ lat, lng, label: address });
              setSearchQuery(address);
            })
            .catch(() => {
              onChange({
                location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng,
              });
            });
        });

        setMap(mapInstance);
        mapInstanceRef.current = mapInstance;
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        // ignore
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          /* empty */
        }
        mapInstanceRef.current = null;
      }
      setMap(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); 

  useEffect(() => {
    if (mapInstanceRef.current && value) {
      const { lat, lng } = value;
      mapInstanceRef.current.setView([lat, lng], 15);

      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
      setSelected(value);
      setSearchQuery(value.label || "");
    }
  }, [value]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
    }

    setSelected({ lat, lng, label: result.display_name });
    onChange({
      location: result.display_name,
      latitude: lat,
      longitude: lng,
    });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Cari alamat atau tempat…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
        {isSearching && (
          <span style={{ marginLeft: 8, fontSize: "smaller", color: "#666" }}>
            Mencari…
          </span>
        )}
        {searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              zIndex: 1000,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              maxHeight: 160,
              width: "calc(100% - 2px)",
              overflowY: "auto",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 8,
                  borderBottom:
                    idx < searchResults.length - 1
                      ? "1px solid #eee"
                      : undefined,
                  cursor: "pointer",
                }}
                onMouseDown={() => handleResultClick(item)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <strong>{item.display_name.split(",")[0]}</strong>
                <div style={{ fontSize: "smaller", color: "#666" }}>
                  {item.display_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "260px",
          borderRadius: 8,
          border: "1px solid #eee",
          marginBottom: 4,
        }}
      />
      {selected && (
        <div style={{ fontSize: 12, marginTop: 8, color: "#666" }}>
          <b>Lokasi terpilih:</b>
          <br />
          {selected.location || selected.label}
          <br />({selected.lat.toFixed(6)}, {selected.lng.toFixed(6)})
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;
