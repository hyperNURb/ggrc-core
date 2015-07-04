# Copyright (C) 2015 Google Inc., authors, and contributors <see AUTHORS file>
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# Created By: miha@reciprocitylabs.com
# Maintained By: miha@reciprocitylabs.com

from werkzeug.exceptions import BadRequest
from sqlalchemy import and_
from sqlalchemy import not_
from sqlalchemy import or_

from ggrc.models.relationship import RelationshipHelper
from ggrc.converters import IMPORTABLE


class QueryHelper(object):

  """ Helper class for handling request queries

  Primary use for this class is to get list of object ids for each object
  defined in the query. All object ids must pass the query filters if they
  are defined.

  query object = [
    {
      object_name: search class name,
      filters: {
        relevant_filters:
          these filters will return all ids of the "search class name" object
          that are mapped to objects defined in the dictionary insde the list.
          [ list of filters joined by OR expression
            [ list of filters joined by AND expression
              {
                "object_name": class of relevant object,
                "slugs": list of relevant object slugs,
                        optional and if exists will be converted into ids
                "ids": list of relevant object ids
              }
            ]
          ],
        object_filters: {
          TODO: allow filtering by title, description and other object fields
        }
      }
    }
  ]
  """

  def __init__(self, query):
    self.object_map = {o.__name__: o for o in IMPORTABLE.values()}
    self.query = self.clean_query(query)

  def clean_query(self, query):
    """ sanitize the query object """
    for object_query in query:
      self.clean_relevant_filters(object_query.get("filters", {}))
      self.clean_object_filters(object_query.get("filters", {}))
    return query

  def clean_object_filters(self, all_filters):
    pass

  def clean_relevant_filters(self, all_filters):
    filters = all_filters.get("relevant_filters")
    if not filters or not filters[0]:
      all_filters["relevant_filters"] = None
      return
    for or_filter in filters:
      for and_filter in or_filter:
        ids = and_filter.get("ids", [])
        if "slugs" in and_filter:
          ids.extend(self.slugs_to_ids(and_filter["object_name"],
                                      and_filter["slugs"]))
        and_filter["ids"] = ids

  def get_ids(self):
    """ get list of objects and their ids according to the query

    Returns:
      list of dicts: The order of dicts is determened by the query.
          Example:
              [
                  {
                      "object_name": <class_name1>,
                      "ids": [ id1, id2, ...]
                  },
                  ...
              ]
    """
    for object_query in self.query:
      object_query["ids"] = self.get_object_ids(object_query)
    return self.query

  def get_object_ids(self, object_query):
    """ get a set of object ids describideb in the filters """
    object_name = object_query["object_name"]
    filters = object_query.get("filters", {})
    relevant_filters = filters.get("relevant_filters")
    relevant_by_ids = None
    if relevant_filters:
      relevant_by_ids = self.get_by_relevant_filters(
          object_name, relevant_filters)
    object_filters = filters.get("object_filters")
    if object_filters:
      return self.get_filtered_object_ids(
          object_name, object_filters, relevant_by_ids)
    if relevant_by_ids:
      return relevant_by_ids
    return set()

  def get_filtered_object_ids(self, object_name, filters, relevant_ids):
    """ get objects by key filters """
    expression = filters.get("expression")
    keys = filters.get("keys")
    object_class = self.object_map[object_name]
    if not expression:
      return relevant_ids

    for key in keys:
      if not hasattr(object_class, key):
        raise Exception("Bad search query: object '{}' does not have "
                        "attribute '{}'.".format(object_name, key))

    def build_expression(exp):
      if exp["op"]["name"] == "AND":
        return and_(build_expression(exp["left"]),
                    build_expression(exp["right"]))
      elif exp["op"]["name"] == "OR":
        return or_(build_expression(exp["left"]),
                   build_expression(exp["right"]))
      elif exp["op"]["name"] == "=":
        return getattr(object_class, exp["left"]) == exp["right"]
      elif exp["op"]["name"] == "!=":
        return getattr(object_class, exp["left"]) != exp["right"]
      elif exp["op"]["name"] == "~":
        return getattr(object_class, exp["left"]).ilike(
            "%{}%".format(exp["right"]))
      elif exp["op"]["name"] == "!~":
        return not_(getattr(object_class, exp["left"]).ilike(
            "%{}%".format(exp["right"])))
      return None

    filter_expression = build_expression(expression)
    if relevant_ids:
      filter_expression = and_(object_class.id.in_(relevant_ids),
                               filter_expression)

    objects = object_class.query.filter(filter_expression).all()
    object_ids = [o.id for o in objects]
    return object_ids

  def get_by_relevant_filters(self, object_name, filters):
    """ get object ids by relevancy filters """
    results = set()
    for or_filters in filters:
      and_results = [RelationshipHelper.get_ids_related_to(
          object_name,
          and_filter["object_name"],
          and_filter["ids"],
      )for and_filter in or_filters]
      and_results = map(set, and_results)
      and_results = reduce(set.intersection, and_results)
      results |= and_results
    return results

  def slugs_to_ids(self, object_name, slugs):
    object_class = self.object_map.get(object_name)
    if not object_class:
      return []
    ids = [c.id for c in object_class.query.filter(
        object_class.slug.in_(slugs)).all()]
    return ids