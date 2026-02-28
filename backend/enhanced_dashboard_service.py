from datetime import datetime, timedelta
from database import get_collection


class DashboardService:
    def __init__(self):
        self.users_collection = get_collection('users')
        self.predictions_collection = get_collection('crop_yield_data')
        self.activities_collection = get_collection('user_activities')

    # ── helpers ──────────────────────────────────────────────────────────
    def _safe_count(self, collection, query=None):
        """Return a count or 0 if the collection doesn't exist / errors."""
        try:
            return collection.count_documents(query or {})
        except Exception:
            return 0

    def _sum_user_stat(self, field: str) -> int:
        """Sum a numeric stats field across all user documents."""
        try:
            pipeline = [
                {'$group': {'_id': None, 'total': {'$sum': f'$stats.{field}'}}}
            ]
            result = list(self.users_collection.aggregate(pipeline))
            return int(result[0]['total']) if result else 0
        except Exception:
            return 0

    # ── stats ────────────────────────────────────────────────────────────
    def get_real_time_stats(self, user_id=None):
        """Return dashboard statistics from real database counts.
        No random/mock values — every number comes from MongoDB."""
        try:
            week_ago = datetime.utcnow() - timedelta(days=7)
            two_weeks_ago = datetime.utcnow() - timedelta(days=14)

            # ─ Total predictions (from user-level counters) ─
            total_predictions = self._sum_user_stat('predictions_made')

            # Predictions saved in last 7 days vs previous 7 days
            recent_preds = self._safe_count(
                self.predictions_collection,
                {'created_at': {'$gte': week_ago}},
            )
            prev_preds = self._safe_count(
                self.predictions_collection,
                {'created_at': {'$gte': two_weeks_ago, '$lt': week_ago}},
            )
            if prev_preds > 0:
                pct = round(((recent_preds - prev_preds) / prev_preds) * 100)
                pred_delta = f'{pct:+d}% vs last week'
            elif recent_preds > 0:
                pred_delta = f'+{recent_preds} this week'
            else:
                pred_delta = 'Make a prediction to get started'

            # ─ Registered users ─
            total_users = self._safe_count(self.users_collection)
            new_users = self._safe_count(
                self.users_collection,
                {'created_at': {'$gte': week_ago}},
            )
            users_delta = (
                f'+{new_users} joined this week'
                if new_users > 0
                else 'Invite farmers to join'
            )

            # ─ Disease detections (from user-level counters) ─
            total_detections = self._sum_user_stat('diseases_detected')

            stats = [
                {
                    'label': 'Total predictions',
                    'value': f'{total_predictions:,}',
                    'delta': pred_delta,
                    'icon': 'ShowChart',
                },
                {
                    'label': 'Registered users',
                    'value': f'{total_users:,}',
                    'delta': users_delta,
                    'icon': 'Grass',
                },
                {
                    'label': 'Disease scans',
                    'value': f'{total_detections:,}',
                    'delta': 'From uploaded images',
                    'icon': 'Bolt',
                },
            ]

            return {'success': True, 'stats': stats}

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'stats': [
                    {'label': 'Total predictions', 'value': '0',
                     'delta': 'Unable to load', 'icon': 'ShowChart'},
                    {'label': 'Registered users', 'value': '0',
                     'delta': 'Unable to load', 'icon': 'Grass'},
                    {'label': 'Disease scans', 'value': '0',
                     'delta': 'Unable to load', 'icon': 'Bolt'},
                ],
            }

    # ── yield trends ─────────────────────────────────────────────────────
    def get_yield_trends(self, user_id=None, months=6):
        """Return yield trend data from stored predictions.
        Returns an empty list (with has_data=False) when there is no history."""
        try:
            cutoff = datetime.utcnow() - timedelta(days=30 * months)
            pipeline = [
                {'$match': {'created_at': {'$gte': cutoff}}},
                {
                    '$group': {
                        '_id': {
                            'month': {'$month': '$created_at'},
                            'year': {'$year': '$created_at'},
                        },
                        'avg_yield': {'$avg': '$predicted_yield'},
                        'count': {'$sum': 1},
                    }
                },
                {'$sort': {'_id.year': 1, '_id.month': 1}},
            ]

            results = list(self.predictions_collection.aggregate(pipeline))

            month_names = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
            ]

            if results:
                trends = [
                    {
                        'month': month_names[r['_id']['month'] - 1],
                        'yield': round(r['avg_yield'], 1),
                    }
                    for r in results[-6:]
                ]
                return {'success': True, 'trends': trends, 'has_data': True}

            return {'success': True, 'trends': [], 'has_data': False}

        except Exception as e:
            return {'success': False, 'error': str(e), 'trends': [], 'has_data': False}

    # ── soil / field health ──────────────────────────────────────────────
    def get_soil_health_signals(self, user_id=None):
        """Soil-health signals require IoT sensor integration.
        Returns an empty list with a flag so the frontend can show an
        appropriate message instead of fabricated numbers."""
        return {
            'success': True,
            'signals': [],
            'has_sensors': False,
            'message': 'Connect IoT soil probes for live field data.',
        }


dashboard_service = DashboardService()