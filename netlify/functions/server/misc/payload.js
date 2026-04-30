const payload = {
    "op": "hydrate",
    "siteId": "scmq7n",
    "themeId": "147263062177",
    "apiParams": [
        [ "siteId", "scmq7n" ],
        [ "resultsFormat", "json"  ],
        [ "resultsPerPage", 24 ],
        [ "redirectResponse", "minimal" ],
        [ "q", "*" ],
        [ "domain", "https://my-test-store-123456789142.myshopify.com/search?q=*" ]
    ],
    "blockSettings": [
        {
            "type": "athos_header",
            "settings": {
                "bold_query": true,
                "search_header_title": ""
            }
        },
        {
            "type": "athos_toolbar",
            "settings": {}
        },
        {
            "type": "athos_sidebar",
            "settings": {
                "palette_swatch_shape": "circle",
                "palette_swatch_border_radius": 11,
                "palette_swatch_width": 50,
                "palette_swatch_height": 50,
                "enable_custom_color_mapping": true
            }
        },
        {
            "type": "athos_results",
            "settings": {
                "results_layout": "both",
                "results_per_page_grid": 24,
                "results_per_row_grid": 4,
                "result_gap_horizontal_grid": 20,
                "result_gap_vertical_grid": 30,
                "enable_banners_grid": true,
                "results_per_page_list": 24,
                "enable_banners_list": true,
                "card_border_width": 0,
                "card_border_color": "",
                "card_border_radius": 0,
                "show_hover_image": true,
                "show_pricing": true,
                "custom_pricing": false,
                "custom_pricing_liquid": null,
                "show_compare_pricing": true,
                "custom_compare_pricing": false,
                "custom_compre_pricing_liquid": null,
                "custom_blocks_liquid": null
            }
        },
        {
            "type": "athos_pagination",
            "settings": {
                "pagination_type": "numbered",
                "pagination_type_custom_logic": ""
            }
        }
    ],
    "sectionSettings": {
        "name": "Search",
        "site_id": "scmq7n",
        "desktop_breakpoint": 1279,
        "tablet_breakpoint": 768,
        "phone_breakpoint": 480
    }
}
export default payload