"""
Django management command to bulk create RoomAvailability entries for accommodations.

Usage:
    python manage.py bulk_create_availability --accommodation-id 1 --start-date 2024-01-01 --end-date 2024-01-31
    python manage.py bulk_create_availability --all --days 30
    python manage.py bulk_create_availability --accommodation-id 1 --start-date 2024-01-01 --end-date 2024-01-31 --status available --price 100000
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import date, timedelta
from accommodations.models import Accommodation, RoomAvailability


class Command(BaseCommand):
    help = 'Bulk create RoomAvailability entries for accommodations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--accommodation-id',
            type=int,
            help='ID of the accommodation to create availability for',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Create availability for all accommodations',
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date (YYYY-MM-DD). Defaults to today if not specified.',
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date (YYYY-MM-DD). Required if --days is not specified.',
        )
        parser.add_argument(
            '--days',
            type=int,
            help='Number of days from start date. Defaults to 30 if not specified.',
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['available', 'unavailable', 'full', 'under_maintenance', 'blocked', 'reserved'],
            default='available',
            help='Default status for created entries. Defaults to "available".',
        )
        parser.add_argument(
            '--price',
            type=float,
            help='Custom price for all days. If not specified, uses accommodation default price.',
        )
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Overwrite existing availability entries',
        )

    def handle(self, *args, **options):
        accommodation_id = options.get('accommodation_id')
        all_accommodations = options.get('all', False)
        start_date_str = options.get('start_date')
        end_date_str = options.get('end_date')
        days = options.get('days')
        status = options.get('status', 'available')
        price = options.get('price')
        overwrite = options.get('overwrite', False)

        # Validate arguments
        if not all_accommodations and not accommodation_id:
            raise CommandError('Either --accommodation-id or --all must be specified.')

        if all_accommodations and accommodation_id:
            raise CommandError('Cannot use both --accommodation-id and --all.')

        # Determine date range
        if start_date_str:
            try:
                start_date = date.fromisoformat(start_date_str)
            except ValueError:
                raise CommandError(f'Invalid start-date format: {start_date_str}. Use YYYY-MM-DD format.')
        else:
            start_date = date.today()

        if end_date_str:
            try:
                end_date = date.fromisoformat(end_date_str)
            except ValueError:
                raise CommandError(f'Invalid end-date format: {end_date_str}. Use YYYY-MM-DD format.')
        elif days:
            end_date = start_date + timedelta(days=days)
        else:
            # Default to 30 days
            end_date = start_date + timedelta(days=30)

        if end_date <= start_date:
            raise CommandError('End date must be after start date.')

        # Get accommodations
        if all_accommodations:
            accommodations = Accommodation.objects.all()
            self.stdout.write(f'Processing {accommodations.count()} accommodations...')
        else:
            try:
                accommodations = [Accommodation.objects.get(id=accommodation_id)]
            except Accommodation.DoesNotExist:
                raise CommandError(f'Accommodation with ID {accommodation_id} does not exist.')

        # Create availability entries
        total_created = 0
        total_updated = 0
        total_skipped = 0

        for accommodation in accommodations:
            self.stdout.write(f'\nProcessing: {accommodation.title} (ID: {accommodation.id})')
            current_date = start_date
            accommodation_created = 0
            accommodation_updated = 0
            accommodation_skipped = 0

            while current_date < end_date:
                # Check if entry already exists
                existing = RoomAvailability.objects.filter(
                    accommodation=accommodation,
                    date=current_date
                ).first()

                if existing and not overwrite:
                    accommodation_skipped += 1
                    current_date += timedelta(days=1)
                    continue

                # Determine price
                entry_price = None
                if price is not None:
                    entry_price = price
                # If price not specified, RoomAvailability.get_price() will use accommodation default

                # Create or update entry
                if existing and overwrite:
                    existing.status = status
                    if price is not None:
                        existing.price = price
                    existing.save()
                    accommodation_updated += 1
                else:
                    RoomAvailability.objects.create(
                        accommodation=accommodation,
                        date=current_date,
                        status=status,
                        price=entry_price
                    )
                    accommodation_created += 1

                current_date += timedelta(days=1)

            total_created += accommodation_created
            total_updated += accommodation_updated
            total_skipped += accommodation_skipped

            self.stdout.write(
                self.style.SUCCESS(
                    f'  Created: {accommodation_created}, '
                    f'Updated: {accommodation_updated}, '
                    f'Skipped: {accommodation_skipped}'
                )
            )

        # Summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('Summary:'))
        self.stdout.write(f'  Total created: {total_created}')
        self.stdout.write(f'  Total updated: {total_updated}')
        self.stdout.write(f'  Total skipped: {total_skipped}')
        self.stdout.write(f'  Date range: {start_date} to {end_date}')
        self.stdout.write('=' * 60)




