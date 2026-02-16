"""
Django management command to seed the database with realistic lighting industry test data.
Populates Products, Drivers, and Accessories for compatibility testing.

Usage: python manage.py seed_lighting_data
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from apps.masters.models import Product, Driver, Accessory
import random


class Command(BaseCommand):
    help = 'Seed database with realistic lighting product, driver, and accessory data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            Product.objects.all().delete()
            Driver.objects.all().delete()
            Accessory.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

        self.stdout.write(self.style.SUCCESS('\n=== SEEDING LIGHTING DATABASE ===\n'))

        # Seed products
        self.seed_products()

        # Seed drivers
        self.seed_drivers()

        # Seed accessories
        self.seed_accessories()

        self.stdout.write(self.style.SUCCESS('\n=== SEEDING COMPLETE ===\n'))
        self.print_summary()

    def seed_products(self):
        """Create 15 realistic lighting products"""
        self.stdout.write('Seeding Products...')

        products_data = [
            # Recessed Downlights
            {
                'make': 'Philips',
                'order_code': 'DL-10W-R',
                'mounting_style': 'RECESSED',
                'wattage': Decimal('10.00'),
                'lumen_output': 800,
                'cct_kelvin': 4000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('500.00'),
                'cutout_diameter_mm': 85,
                'beam_angle_degree': '60°',
                'characteristics': '10W Recessed LED Downlight, Dimmable',
            },
            {
                'make': 'Osram',
                'order_code': 'DL-15W-CW',
                'mounting_style': 'RECESSED',
                'wattage': Decimal('15.00'),
                'lumen_output': 1200,
                'cct_kelvin': 4000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('650.00'),
                'cutout_diameter_mm': 95,
                'beam_angle_degree': '60°',
                'characteristics': '15W Recessed LED Downlight, Premium CRI>90',
            },
            {
                'make': 'GE Lighting',
                'order_code': 'DL-20W-WW',
                'mounting_style': 'RECESSED',
                'wattage': Decimal('20.00'),
                'lumen_output': 1600,
                'cct_kelvin': 3000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('750.00'),
                'cutout_diameter_mm': 110,
                'beam_angle_degree': '45°',
                'characteristics': 'Warm White Recessed LED, Ambient Lighting',
            },

            # Surface Panel Lights
            {
                'make': 'Havells',
                'order_code': 'SPA-24W-NW',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('24.00'),
                'lumen_output': 2000,
                'cct_kelvin': 4000,
                'ip_class': 44,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('1200.00'),
                'diameter_mm': 300,
                'characteristics': '24W Surface Panel Light, Semi-flush mount',
            },
            {
                'make': 'Crompton',
                'order_code': 'SPA-36W-BR',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('36.00'),
                'lumen_output': 3000,
                'cct_kelvin': 6500,
                'ip_class': 44,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('1400.00'),
                'diameter_mm': 450,
                'characteristics': '36W Bright White Panel, Office/Commercial',
            },
            {
                'make': 'Eaton',
                'order_code': 'SPA-12W-RGB',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('12.00'),
                'lumen_output': 1000,
                'cct_kelvin': 4000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('900.00'),
                'diameter_mm': 200,
                'characteristics': 'RGB Tunable White Panel, Smart Home Ready',
            },

            # Track Mounted Spotlights
            {
                'make': 'Siemens',
                'order_code': 'TS-20W-COB',
                'mounting_style': 'TRACK MOUNTED',
                'wattage': Decimal('20.00'),
                'lumen_output': 1800,
                'cct_kelvin': 4000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('850.00'),
                'beam_angle_degree': '15°',
                'characteristics': 'Track Spotlight COB, Accent Lighting',
            },
            {
                'make': 'Legrand',
                'order_code': 'TS-30W-FAN',
                'mounting_style': 'TRACK MOUNTED',
                'wattage': Decimal('30.00'),
                'lumen_output': 2700,
                'cct_kelvin': 3000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('1100.00'),
                'beam_angle_degree': '24°',
                'characteristics': 'High Power Track Spotlight, Retail Display',
            },

            # Outdoor Products
            {
                'make': 'Philips',
                'order_code': 'BO-12W-LED',
                'mounting_style': 'INGROUND',
                'wattage': Decimal('12.00'),
                'lumen_output': 900,
                'cct_kelvin': 4000,
                'ip_class': 67,
                'environment': 'OUTDOOR',
                'driver_integration': 'INTEGRATED',
                'base_price': Decimal('1800.00'),
                'diameter_mm': 100,
                'characteristics': 'Inground Bollard, IP67 Sealed',
            },
            {
                'make': 'Sylvania',
                'order_code': 'GS-9W-STUD',
                'mounting_style': 'INGROUND',
                'wattage': Decimal('9.00'),
                'lumen_output': 650,
                'cct_kelvin': 3000,
                'ip_class': 67,
                'environment': 'OUTDOOR',
                'driver_integration': 'INTEGRATED',
                'base_price': Decimal('1500.00'),
                'diameter_mm': 85,
                'characteristics': 'Underground Landscape Light, Stainless Steel',
            },
            {
                'make': 'Cree',
                'order_code': 'FL-50W-PROJ',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('50.00'),
                'lumen_output': 4500,
                'cct_kelvin': 5000,
                'ip_class': 65,
                'environment': 'OUTDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('2500.00'),
                'beam_angle_degree': '120°',
                'characteristics': 'Outdoor Flood Light, Stadium/Building',
            },

            # Linear & Special Purpose
            {
                'make': 'Aurora',
                'order_code': 'LN-14W-COVE',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('14.00'),
                'lumen_output': 1100,
                'cct_kelvin': 3000,
                'ip_class': 44,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('600.00'),
                'length_mm': 600,
                'characteristics': 'Linear Cove Light, Indirect Ambient',
            },
            {
                'make': 'Luceco',
                'order_code': 'WW-24W-WASH',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('24.00'),
                'lumen_output': 2200,
                'cct_kelvin': 4000,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('1000.00'),
                'beam_angle_degree': '120°',
                'characteristics': 'Wall Washer Light, Architectural',
            },
            {
                'make': 'Innolux',
                'order_code': 'ST-28W-STRIP',
                'mounting_style': 'SURFACE',
                'wattage': Decimal('28.00'),
                'lumen_output': 2400,
                'cct_kelvin': 6500,
                'ip_class': 20,
                'environment': 'INDOOR',
                'driver_integration': 'EXTERNAL',
                'base_price': Decimal('700.00'),
                'length_mm': 1200,
                'characteristics': 'Linear LED Strip, Task Lighting',
            },
        ]

        created_count = 0
        for product_data in products_data:
            try:
                product, created = Product.objects.get_or_create(
                    order_code=product_data['order_code'],
                    defaults=product_data
                )
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ {product.make} - {product.order_code}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  - {product.make} - {product.order_code} (already exists)')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed to create {product_data.get("order_code")}: {str(e)}')
                )

        self.stdout.write(self.style.SUCCESS(f'Products: {created_count} created\n'))

    def seed_drivers(self):
        """Create 10 realistic lighting drivers with varied specifications"""
        self.stdout.write('Seeding Drivers...')

        drivers_data = [
            # Constant Current Drivers
            {
                'driver_code': 'CC-350MA-15W',
                'driver_make': 'Meanwell',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 15,
                'constant_type': 'CC',
                'output_current_ma': 350,
                'output_voltage_min': 24,
                'output_voltage_max': 48,
                'dimming_protocol': 'NONE',
                'ip_class': 20,
                'warranty_years': 2,
                'base_price': Decimal('400.00'),
                'dimmable': 'NO',
            },
            {
                'driver_code': 'CC-350MA-DALI',
                'driver_make': 'Tridonic',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 15,
                'constant_type': 'CC',
                'output_current_ma': 350,
                'output_voltage_min': 24,
                'output_voltage_max': 48,
                'dimming_protocol': 'DALI',
                'ip_class': 20,
                'warranty_years': 5,
                'base_price': Decimal('600.00'),
                'dimmable': 'YES',
            },
            {
                'driver_code': 'CC-700MA-30W',
                'driver_make': 'Meanwell',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 30,
                'constant_type': 'CC',
                'output_current_ma': 700,
                'output_voltage_min': 32,
                'output_voltage_max': 48,
                'dimming_protocol': 'NONE',
                'ip_class': 20,
                'warranty_years': 2,
                'base_price': Decimal('550.00'),
                'dimmable': 'NO',
            },
            {
                'driver_code': 'CC-700MA-0-10V',
                'driver_make': 'Philips',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 30,
                'constant_type': 'CC',
                'output_current_ma': 700,
                'output_voltage_min': 32,
                'output_voltage_max': 48,
                'dimming_protocol': '0-10V',
                'ip_class': 20,
                'warranty_years': 3,
                'base_price': Decimal('650.00'),
                'dimmable': 'YES',
            },
            {
                'driver_code': 'CC-1050MA-50W',
                'driver_make': 'Meanwell',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 50,
                'constant_type': 'CC',
                'output_current_ma': 1050,
                'output_voltage_min': 32,
                'output_voltage_max': 48,
                'dimming_protocol': 'NONE',
                'ip_class': 20,
                'warranty_years': 2,
                'base_price': Decimal('700.00'),
                'dimmable': 'NO',
            },
            {
                'driver_code': 'CC-1050MA-DALI',
                'driver_make': 'Osram',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 50,
                'constant_type': 'CC',
                'output_current_ma': 1050,
                'output_voltage_min': 32,
                'output_voltage_max': 48,
                'dimming_protocol': 'DALI',
                'ip_class': 20,
                'warranty_years': 5,
                'base_price': Decimal('900.00'),
                'dimmable': 'YES',
            },

            # Constant Voltage Drivers
            {
                'driver_code': 'CV-24V-60W',
                'driver_make': 'Meanwell',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 60,
                'constant_type': 'CV',
                'output_current_ma': 2500,
                'output_voltage_min': 23,
                'output_voltage_max': 25,
                'dimming_protocol': 'NONE',
                'ip_class': 20,
                'warranty_years': 3,
                'base_price': Decimal('800.00'),
                'dimmable': 'NO',
            },
            {
                'driver_code': 'CV-24V-TRIAC',
                'driver_make': 'Inventronics',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 40,
                'constant_type': 'CV',
                'output_current_ma': 1667,
                'output_voltage_min': 23,
                'output_voltage_max': 25,
                'dimming_protocol': 'TRIAC',
                'ip_class': 20,
                'warranty_years': 3,
                'base_price': Decimal('650.00'),
                'dimmable': 'YES',
            },

            # Outdoor IP67 Drivers
            {
                'driver_code': 'IP67-CC-350MA-OUT',
                'driver_make': 'Meanwell',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 15,
                'constant_type': 'CC',
                'output_current_ma': 350,
                'output_voltage_min': 24,
                'output_voltage_max': 48,
                'dimming_protocol': 'NONE',
                'ip_class': 67,
                'warranty_years': 5,
                'base_price': Decimal('1200.00'),
                'dimmable': 'NO',
            },
            {
                'driver_code': 'IP67-CC-700MA-OUT',
                'driver_make': 'Tridonic',
                'input_voltage_min': 180,
                'input_voltage_max': 240,
                'max_wattage': 30,
                'constant_type': 'CC',
                'output_current_ma': 700,
                'output_voltage_min': 32,
                'output_voltage_max': 48,
                'dimming_protocol': 'NONE',
                'ip_class': 67,
                'warranty_years': 5,
                'base_price': Decimal('1400.00'),
                'dimmable': 'NO',
            },
        ]

        created_count = 0
        for driver_data in drivers_data:
            try:
                driver, created = Driver.objects.get_or_create(
                    driver_code=driver_data['driver_code'],
                    defaults=driver_data
                )
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ {driver.driver_make} - {driver.driver_code}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  - {driver.driver_make} - {driver.driver_code} (already exists)')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed to create {driver_data.get("driver_code")}: {str(e)}')
                )

        self.stdout.write(self.style.SUCCESS(f'Drivers: {created_count} created\n'))

    def seed_accessories(self):
        """Create 15 realistic lighting accessories with varied mounting compatibility"""
        self.stdout.write('Seeding Accessories...')

        accessories_data = [
            # Mounting Accessories
            {
                'accessory_name': 'Spring Clip Kit',
                'accessory_type': 'Recessed Mount Spring Clamp',
                'accessory_category': 'MOUNTING',
                'compatible_mounting_styles': ['RECESSED'],
                'min_diameter_mm': 75,
                'max_diameter_mm': 120,
                'compatible_ip_class': 20,
                'description': 'Stainless steel spring clips for recessed downlight installation',
                'base_price': Decimal('120.00'),
            },
            {
                'accessory_name': 'Surface Mounting Ring',
                'accessory_type': 'Decorative Trim Ring',
                'accessory_category': 'MOUNTING',
                'compatible_mounting_styles': ['SURFACE'],
                'compatible_ip_class': 20,
                'description': 'Chrome/matte finish surface mounting ring',
                'base_price': Decimal('150.00'),
            },
            {
                'accessory_name': 'Track Mounting Adapter',
                'accessory_type': 'Standard Track System Adapter',
                'accessory_category': 'MOUNTING',
                'compatible_mounting_styles': ['TRACK MOUNTED'],
                'description': 'Universal track adapter for 48V track systems',
                'base_price': Decimal('200.00'),
            },
            {
                'accessory_name': 'Ground Spike Kit',
                'accessory_type': 'Inground Anchor Spike',
                'accessory_category': 'MOUNTING',
                'compatible_mounting_styles': ['INGROUND'],
                'compatible_ip_class': 67,
                'description': 'Stainless steel ground spike anchor for landscape lights',
                'base_price': Decimal('180.00'),
            },
            {
                'accessory_name': 'Universal Mounting Bracket',
                'accessory_type': 'Multi-Style Mounting Bracket',
                'accessory_category': 'MOUNTING',
                'compatible_mounting_styles': ['SURFACE', 'RECESSED', 'INGROUND'],
                'description': 'Adjustable aluminum bracket supports multiple mounting styles',
                'base_price': Decimal('250.00'),
            },

            # Optical Accessories
            {
                'accessory_name': 'Honeycomb Louver',
                'accessory_type': 'Anti-Glare Louver',
                'accessory_category': 'OPTICAL',
                'compatible_mounting_styles': ['RECESSED', 'SURFACE'],
                'min_diameter_mm': 75,
                'max_diameter_mm': 110,
                'description': 'Aluminum honeycomb louver reduces glare and light scatter',
                'base_price': Decimal('180.00'),
            },
            {
                'accessory_name': 'Anti-Glare Shield',
                'accessory_type': 'Baffle Diffuser',
                'accessory_category': 'OPTICAL',
                'compatible_mounting_styles': ['TRACK MOUNTED'],
                'description': 'Prevents direct glare from spotlights',
                'base_price': Decimal('120.00'),
            },
            {
                'accessory_name': 'Frosted Glass Diffuser',
                'accessory_type': 'Optical Grade Diffuser Panel',
                'accessory_category': 'OPTICAL',
                'compatible_mounting_styles': ['SURFACE', 'RECESSED'],
                'min_diameter_mm': 150,
                'max_diameter_mm': 500,
                'description': 'Frosted PMMA diffuser for even light distribution',
                'base_price': Decimal('220.00'),
            },
            {
                'accessory_name': 'Linear Lens Assembly',
                'accessory_type': 'Optical Lens System',
                'accessory_category': 'OPTICAL',
                'compatible_mounting_styles': ['SURFACE'],
                'description': 'Linear optics for beam shaping and control',
                'base_price': Decimal('280.00'),
            },
            {
                'accessory_name': 'UV Filter',
                'accessory_type': 'UV Protection Filter',
                'accessory_category': 'OPTICAL',
                'compatible_mounting_styles': ['OUTDOOR'],
                'description': 'Blocks UV radiation, extends product life',
                'base_price': Decimal('150.00'),
            },

            # Decorative Accessories
            {
                'accessory_name': 'Decorative Trim Ring - Chrome',
                'accessory_type': 'Finish Ring',
                'accessory_category': 'DECORATIVE',
                'compatible_mounting_styles': ['RECESSED', 'SURFACE'],
                'min_diameter_mm': 75,
                'max_diameter_mm': 120,
                'description': 'Chrome plated decorative finish ring',
                'base_price': Decimal('200.00'),
            },
            {
                'accessory_name': 'Finish Ring - Matte Black',
                'accessory_type': 'Matte Trim Ring',
                'accessory_category': 'DECORATIVE',
                'compatible_mounting_styles': ['RECESSED', 'SURFACE'],
                'min_diameter_mm': 75,
                'max_diameter_mm': 120,
                'description': 'Matte black aluminum trim ring',
                'base_price': Decimal('180.00'),
            },

            # Installation Accessories
            {
                'accessory_name': 'IP67 Gasket Kit',
                'accessory_type': 'Waterproof Sealing Kit',
                'accessory_category': 'INSTALLATION',
                'compatible_mounting_styles': ['INGROUND', 'SURFACE'],
                'compatible_ip_class': 67,
                'description': 'EPDM gasket kit for IP67 weatherproof sealing',
                'base_price': Decimal('250.00'),
            },
            {
                'accessory_name': 'Connector Cable Assembly',
                'accessory_type': 'Wire Harness',
                'accessory_category': 'INSTALLATION',
                'compatible_mounting_styles': ['SURFACE', 'RECESSED', 'TRACK MOUNTED', 'INGROUND'],
                'description': '3-pin/4-pin connector cable for driver connection',
                'base_price': Decimal('100.00'),
            },
            {
                'accessory_name': 'Thermal Management Pad',
                'accessory_type': 'Heat Sink Thermal Interface',
                'accessory_category': 'INSTALLATION',
                'compatible_mounting_styles': ['SURFACE', 'RECESSED'],
                'description': 'Silicone thermal pad improves heat dissipation',
                'base_price': Decimal('80.00'),
            },
        ]

        created_count = 0
        for acc_data in accessories_data:
            try:
                # Ensure compatible_mounting_styles is a list
                if not isinstance(acc_data['compatible_mounting_styles'], list):
                    acc_data['compatible_mounting_styles'] = [acc_data['compatible_mounting_styles']]

                accessory, created = Accessory.objects.get_or_create(
                    accessory_name=acc_data['accessory_name'],
                    defaults=acc_data
                )
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ {accessory.accessory_name}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  - {accessory.accessory_name} (already exists)')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Failed to create {acc_data.get("accessory_name")}: {str(e)}')
                )

        self.stdout.write(self.style.SUCCESS(f'Accessories: {created_count} created\n'))

    def print_summary(self):
        """Print summary of seeded data"""
        product_count = Product.objects.count()
        driver_count = Driver.objects.count()
        accessory_count = Accessory.objects.count()

        self.stdout.write(self.style.SUCCESS('SUMMARY:'))
        self.stdout.write(f'  Products: {product_count}')
        self.stdout.write(f'  Drivers: {driver_count}')
        self.stdout.write(f'  Accessories: {accessory_count}')
        self.stdout.write('\nDatabase is ready for testing!')
