window.DASHBOARD_DATA = {
  "meta": {
    "defaultLang": "es",
    "stepSeconds": 1.2,
    "loopSeconds": 0,
    "canvas": {
      "w": 3840,
      "h": 2160
    },
    "safe": {
      "w": 3784,
      "h": 1290
    },
    "bg": [
      "#67769b",
      "#7b88a8",
      "#56648b",
      "#2c3653",
      "#232c46"
    ],
    "topTitleSize": 13.5,
    "cardTitleSize": 13
  },
  "ui": {
    "title": {
      "es": "LA RED DE TELEFÓNICA EN CIFRAS",
      "en": "TELEFONICA'S NETWORK IN FIGURES"
    },
    "replay": {
      "es": "Repetir animación (R)",
      "en": "Replay animation (R)"
    },
    "full": {
      "es": "Pantalla completa (F)",
      "en": "Fullscreen (F)"
    },
    "missing": {
      "es": "Coloca aquí la imagen:",
      "en": "Place the image here:"
    },
    "title_pos": {
      "x": 48,
      "y": 36,
      "size": 34
    }
  },
  "boxes": [
    {
      "id": "img-trafico-movil",
      "type": "image",
      "x": 48,
      "y": 86,
      "w": 429,
      "h": 160,
      "step": 0,
      "title": {
        "es": "Evolución del tráfico móvil en España por provincia y municipio",
        "en": "Traffic evolution in Spain by geography"
      },
      "image": "img/panel1.png"
    },
    {
      "id": "img-telxius",
      "type": "image",
      "x": 513,
      "y": 86,
      "w": 429,
      "h": 160,
      "step": 0,
      "title": {
        "es": "Mapa de la red de Telxius",
        "en": "Telxius network map"
      },
      "image": "img/panel2.png"
    },
    {
      "id": "img-red-internacional",
      "type": "image",
      "x": 978,
      "y": 86,
      "w": 429,
      "h": 160,
      "step": 0,
      "title": {
        "es": "Mapa de la red internacional de Telefónica",
        "en": "Telefonica's international network"
      },
      "image": "img/panel3.png"
    },
    {
      "id": "img-red-ip",
      "type": "image",
      "x": 1443,
      "y": 86,
      "w": 429,
      "h": 160,
      "step": 0,
      "title": {
        "es": "La red internacional IP de Telefónica",
        "en": "Telefonica's international IP network"
      },
      "image": "img/panel4.png"
    },
    {
      "id": "red-en-cifras",
      "type": "network",
      "x": 48,
      "y": 256,
      "w": 429,
      "h": 389,
      "step": 1,
      "title": {
        "es": "La red de Telefónica en cifras",
        "en": "Telefonica's network: key figures"
      },
      "blocks": [
        {
          "col": 1,
          "type": "gauges",
          "title": {
            "es": "Red de banda ultra ancha de Telefónica",
            "en": "Telefonica's ultrabroadband network"
          },
          "items": [
            {
              "label": {
                "es": "Hogares pasados con banda ultra ancha",
                "en": "UBB premises passed"
              },
              "value": 162,
              "max": 220,
              "prefix": "+",
              "unit": "M"
            },
            {
              "label": {
                "es": "Hogares pasados con banda ultra ancha (red propia)",
                "en": "UBB premises passed (own network)"
              },
              "value": 184,
              "max": 220,
              "prefix": "+",
              "unit": "M"
            }
          ]
        },
        {
          "col": 1,
          "type": "icons",
          "title": {
            "es": "Red móvil de Telefónica",
            "en": "Telefonica's mobile network"
          },
          "items": [
            {
              "icon": "coverage",
              "value": 95,
              "max": 100,
              "unit": "%",
              "label": {
                "es": "Cobertura 4G total",
                "en": "Total 4G coverage"
              },
              "prefix": ""
            },
            {
              "icon": "sites",
              "value": 120,
              "max": 200,
              "unit": "K",
              "label": {
                "es": "Sitios móviles totales",
                "en": "Total mobile sites"
              },
              "prefix": "+"
            },
            {
              "icon": "coverage",
              "value": 92,
              "max": 100,
              "unit": "%",
              "label": {
                "es": "Cobertura 4G",
                "en": "4G coverage"
              },
              "prefix": ""
            },
            {
              "icon": "coverage",
              "value": 100,
              "max": 100,
              "unit": "%",
              "label": {
                "es": "Cobertura 4G",
                "en": "4G coverage"
              },
              "prefix": ""
            }
          ]
        },
        {
          "col": 1,
          "type": "chips",
          "title": {
            "es": "Red 5G de Telefónica",
            "en": "Telefonica's 5G network"
          },
          "groups": [
            {
              "label": {
                "es": "Cobertura 5G",
                "en": "5G coverage"
              },
              "items": [
                {
                  "code": "ESP",
                  "value": 95,
                  "max": 100,
                  "prefix": "",
                  "unit": "%",
                  "dec": 0
                }
              ]
            },
            {
              "label": {
                "es": "Ciudades y pueblos con 5G",
                "en": "Cities and towns with 5G"
              },
              "items": [
                {
                  "code": "ENG",
                  "value": 67,
                  "max": 100,
                  "prefix": "",
                  "unit": "%",
                  "dec": 0
                },
                {
                  "code": "GER",
                  "value": 99,
                  "max": 100,
                  "prefix": "",
                  "unit": "%",
                  "dec": 0
                },
                {
                  "code": "BRA",
                  "value": 67,
                  "max": 100,
                  "prefix": "",
                  "unit": "%",
                  "dec": 0
                }
              ]
            }
          ]
        },
        {
          "col": 2,
          "type": "chips",
          "title": {
            "es": "Red de fibra de Telefónica — hogares pasados con FTTH",
            "en": "Telefonica's fibre network — FTTH premises passed"
          },
          "items": [
            {
              "code": "ESP",
              "value": 31,
              "max": 40,
              "prefix": "+",
              "unit": "M",
              "dec": 0
            },
            {
              "code": "BRA",
              "value": 30,
              "max": 40,
              "prefix": "+",
              "unit": "M",
              "dec": 0
            },
            {
              "code": "GER",
              "value": 4,
              "max": 40,
              "prefix": "+",
              "unit": "M",
              "dec": 0
            }
          ]
        },
        {
          "col": 2,
          "type": "note",
          "title": {
            "es": "Consumo energético de la red de Telefónica",
            "en": "Telefonica's network energy consumption"
          },
          "text": {
            "es": "100% de electricidad renovable",
            "en": "100% renewable electricity"
          },
          "codes": [
            "ESP",
            "ENG",
            "GER",
            "BRA"
          ]
        },
        {
          "col": 2,
          "type": "trend",
          "title": {
            "es": "Evolución del consumo energético por unidad de tráfico (MWh/PB)",
            "en": "Energy consumption evolution by traffic unit (MWh/PB)"
          },
          "labels": [
            "2018",
            "2019",
            "2020",
            "2021",
            "2022",
            "2023",
            "2024",
            "2025"
          ],
          "values": [100, 90, 82, 75, 68, 62, 55, 51],
          "badge": "-49%"
        }
      ]
    },
    {
      "id": "trafico-total",
      "type": "area",
      "x": 513,
      "y": 256,
      "w": 429,
      "h": 190,
      "step": 2,
      "title": {
        "es": "Evolución del tráfico total de Internet en la red de Telefónica",
        "en": "Total Internet traffic evolution in Telefonica Spain"
      },
      "xLabels": [
        "2023",
        "2024",
        "2025"
      ],
      "values": [100, 98, 102, 105, 101, 99, 97, 104, 110, 115, 120, 118, 122, 120, 124, 128, 125, 122, 120, 128, 135, 142, 148, 146, 150, 152, 158, 165, 170, 168, 172, 180, 190, 205, 225, 260],
      "badge": "+160%"
    },
    {
      "id": "consumo-medio",
      "type": "stat",
      "x": 513,
      "y": 456,
      "w": 429,
      "h": 189,
      "step": 2,
      "title": {
        "es": "Consumo medio de tráfico por usuario de Telefónica",
        "en": "Average traffic consumption by Telefonica user"
      },
      "items": [
        {
          "icon": "fixed",
          "value": 659,
          "max": 800,
          "unit": {
            "es": "GB/mes",
            "en": "GB/month"
          },
          "label": {
            "es": "Datos fijos por usuario",
            "en": "Fixed data traffic by user"
          },
          "text": {
            "es": "Esto supone en las redes fijas de Telefónica más de 11.000 PBytes/mes, unos 2.800 millones de episodios de series en HD.",
            "en": "This means more than 11,000 PBytes/month on our fixed networks, around 2,800 million HD series episodes."
          }
        },
        {
          "icon": "mobile",
          "value": 12,
          "max": 20,
          "unit": {
            "es": "GB/mes",
            "en": "GB/month"
          },
          "label": {
            "es": "Datos móviles por usuario",
            "en": "Mobile data traffic by user"
          },
          "text": {
            "es": "Esto supone en las redes móviles de Telefónica más de 2.100 PBytes/mes, unos 539 millones de episodios de series en HD.",
            "en": "This means more than 2,100 PBytes/month on our mobile networks, around 539 million HD series episodes."
          }
        }
      ]
    },
    {
      "id": "trafico-categorias",
      "type": "stacked",
      "x": 978,
      "y": 256,
      "w": 429,
      "h": 389,
      "step": 3,
      "title": {
        "es": "Evolución del tráfico por categoría de servicios",
        "en": "Traffic evolution by service category"
      },
      "xLabels": [
        "2023",
        "2024",
        "2025"
      ],
      "series": [
        {
          "name": {
            "es": "Vídeo OTT",
            "en": "OTT video"
          },
          "color": "#e4e7ee",
          "values": [40, 40, 41, 41, 42, 42, 43, 44, 44, 45, 45, 46]
        },
        {
          "name": {
            "es": "Navegación web",
            "en": "Web browsing"
          },
          "color": "#f08a24",
          "values": [27, 27, 26, 26, 25, 25, 24, 24, 23, 23, 22, 22]
        },
        {
          "name": {
            "es": "Redes sociales",
            "en": "Social media"
          },
          "color": "#9aa3b8",
          "values": [8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9]
        },
        {
          "name": {
            "es": "Gaming",
            "en": "Gaming"
          },
          "color": "#f5b400",
          "values": [5, 6, 5, 6, 6, 6, 5, 6, 6, 6, 6, 6]
        },
        {
          "name": {
            "es": "p2p",
            "en": "p2p"
          },
          "color": "#ffe066",
          "values": [3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2]
        },
        {
          "name": {
            "es": "Descargas",
            "en": "Downloads"
          },
          "color": "#4db3f0",
          "values": [4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4]
        },
        {
          "name": {
            "es": "Adultos",
            "en": "Adult"
          },
          "color": "#2e8f7a",
          "values": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
        },
        {
          "name": {
            "es": "VPN",
            "en": "VPN"
          },
          "color": "#7ed957",
          "values": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
        },
        {
          "name": {
            "es": "Almacenamiento",
            "en": "Storage"
          },
          "color": "#a78bfa",
          "values": [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2]
        },
        {
          "name": {
            "es": "Otros",
            "en": "Other"
          },
          "color": "#5f6f92",
          "values": [3, 2, 3, 2, 2, 3, 2, 2, 2, 2, 2, 2]
        }
      ]
    },
    {
      "id": "semanal-fibra",
      "type": "multi",
      "x": 1443,
      "y": 256,
      "w": 429,
      "h": 190,
      "step": 4,
      "title": {
        "es": "Evolución semanal del tráfico por acceso de fibra, acceso cobre residencial, acceso fijo empresas y acceso móvil residencial y de empresas",
        "en": "Weekly traffic evolution in fiber access, residential copper access, enterprise fix access and residential & enterprise mobile access"
      },
      "days": {
        "es": [
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo"
        ],
        "en": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ]
      },
      "series": [
        {
          "name": {
            "es": "Acceso fibra residencial",
            "en": "Residential fiber access"
          },
          "color": "#ffffff",
          "values": [30, 55, 70, 92, 30, 55, 70, 92, 30, 55, 70, 92, 30, 55, 70, 92, 30, 55, 70, 92, 38, 62, 78, 100, 35, 60, 75, 96]
        },
        {
          "name": {
            "es": "Acceso cobre residencial",
            "en": "Residential copper access"
          },
          "color": "#f08a24",
          "values": [12, 22, 30, 38, 12, 22, 30, 38, 12, 22, 30, 38, 12, 22, 30, 38, 12, 22, 30, 38, 14, 24, 32, 40, 13, 23, 31, 39]
        },
        {
          "name": {
            "es": "Acceso fijo empresas",
            "en": "Enterprise fix access"
          },
          "color": "#4db3f0",
          "values": [8, 58, 64, 30, 8, 58, 64, 30, 8, 58, 64, 30, 8, 58, 64, 30, 8, 58, 64, 30, 6, 12, 12, 10, 5, 9, 9, 8]
        },
        {
          "name": {
            "es": "Acceso móvil resid. + empresas",
            "en": "Residential + enterprise mobile access"
          },
          "color": "#ff6b8b",
          "values": [10, 30, 38, 40, 10, 30, 38, 40, 10, 30, 38, 40, 10, 30, 38, 40, 10, 30, 38, 40, 10, 26, 34, 36, 9, 24, 32, 34]
        }
      ]
    },
    {
      "id": "semanal-cobre",
      "type": "multi",
      "x": 1443,
      "y": 456,
      "w": 429,
      "h": 189,
      "step": 4,
      "title": {
        "es": "Evolución semanal del tráfico por acceso cobre residencial, acceso fijo empresas y acceso móvil residencial y de empresas",
        "en": "Weekly traffic evolution in residential copper access, enterprise fix access and residential & enterprise mobile accesses"
      },
      "days": {
        "es": [
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo"
        ],
        "en": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ]
      },
      "series": [
        {
          "name": {
            "es": "Acceso cobre residencial",
            "en": "Residential copper access"
          },
          "color": "#f08a24",
          "values": [12, 22, 30, 38, 12, 22, 30, 38, 12, 22, 30, 38, 12, 22, 30, 38, 12, 22, 30, 38, 14, 24, 32, 40, 13, 23, 31, 39]
        },
        {
          "name": {
            "es": "Acceso fijo empresas",
            "en": "Enterprise fix access"
          },
          "color": "#4db3f0",
          "values": [8, 58, 64, 30, 8, 58, 64, 30, 8, 58, 64, 30, 8, 58, 64, 30, 8, 58, 64, 30, 6, 12, 12, 10, 5, 9, 9, 8]
        },
        {
          "name": {
            "es": "Acceso móvil resid. + empresas",
            "en": "Residential + enterprise mobile access"
          },
          "color": "#ff6b8b",
          "values": [10, 30, 38, 40, 10, 30, 38, 40, 10, 30, 38, 40, 10, 30, 38, 40, 10, 30, 38, 40, 10, 26, 34, 36, 9, 24, 32, 34]
        }
      ]
    }
  ]
};
