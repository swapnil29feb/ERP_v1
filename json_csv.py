import csv
import pandas as pd
import sqlite3


df = pd.read_csv("Products_Tabular.csv")
# Connect to the SQLite database
conn = sqlite3.connect('db.sqlite3')


# Rename DataFrame columns to match the database table columns
# Replace 'old_name_1' with the CSV column name and 'new_name_1' with the DB column name
df_renamed_col = df.rename(columns={
    'Make':'make',
    'Luminaire Colour (RAL)': 'luminaire_color_ral',
    'Order Code': 'order_code',
    'Characteristics': 'characteristics',
    'DIA (mm)': 'diameter_mm',
    'Length (mm)': 'length_mm',
    'Width (mm)': 'width_mm',
    'Height (mm)': 'height_mm',
    'Mounting Type': 'mounting_style',
    'Beam Angle (Degree)': 'beam_angle_degree',
    'IP Class': 'ip_class',
    'Wattage (Nominal) (W)': 'wattage',
    'Op. Voltage (V)': 'op_voltage',
    'Op. Current (A)': 'op_current',
    'Lumen Output (lm)': 'lumen_output',
    'CCT (Kelvin)': 'cct_kelvin',
    'CRI': 'cri_cci',
    'Lumen Efficacy (lum/w)': 'lumen_efficency',
    'Driver Make': '',
    'Driver Order Code': '',
    'Driver Type': '',
    'Dimmable': '',
    'Weight/Luminaire (kg)': 'weight_kg',
    'Warranty Period (Year)': 'warranty_years',
    'Remarks': '',
    'Website Link': 'website_link',
    'Visual details': 'visual_image',
})    

print(df_renamed_col)

print(df_renamed_col.columns)

# Select only the columns you want to import, in the correct order
# Make sure the list of columns matches the database table structure
columns_to_import = ['make', 'order_code',
                     'luminaire_color_ral',
                     'characteristics',
                     'diameter_mm',
                     'length_mm',
                     'width_mm',
                     'height_mm',
                     'mounting_style',
                     'beam_angle_degree',
                     'ip_class',
                     'wattage',
                     'op_voltage',
                     'op_current',
                     'lumen_output',
                     'cct_kelvin',
                     'cri_cci',
                     'lumen_efficency',
                     'weight_kg',
                     'warranty_years',
                     'website_link',
                     'visual_image',
                     ]
df_filtered = df_renamed_col[columns_to_import]
df_filtered["driver_integration"] = "EXTERNAL"   # or "INTERNAL"
df_filtered["base_price"] = df.get("base_price", 50)  # optional
df_filtered["length_mm"] = df.get("length_mm", None)

# df_filtered = df_renamed_col[columns_to_import]
# df_filtered.to_sql('masters_product', conn, if_exists='append', index=False)

# Write the data to the SQLite table
df_filtered.to_sql('masters_product', conn, if_exists='append', index=False)


# Close the connection
conn.close()

# make
# order_code
# luminaire_color_ral
# characteristics
# diameter_mm
# length_mm
# width_mm
# height_mm
# mounting_style
# beam_angle_degree
# ip_class
# wattage
# op_voltage
# op_current
# lumen_output
# cct_kelvin
# cri_cci
# lumen_efficency
# weight_kg
# warranty_years
# website_link
# visual_image
# base_price