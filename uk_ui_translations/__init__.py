import logging
import os

from odoo.tools import translate as odoo_translate
from odoo.tools.translate import code_translations, get_base_langs

_logger = logging.getLogger(__name__)

EXTRA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'i18n_extra')

_original_get_po_paths = odoo_translate.get_po_paths


def get_po_paths(module_name, lang):
    """Odoo's PO files of the module, then ours (read last: they only add terms)."""
    yield from _original_get_po_paths(module_name, lang)
    for base_lang in get_base_langs(lang):
        path = os.path.join(EXTRA_DIR, module_name, base_lang + '.po')
        if os.path.isfile(path):
            yield path


get_po_paths._uk_ui_translations = True


def _patch_po_paths():
    """``get_po_paths`` is imported by name in several places: patch each of them."""
    if getattr(odoo_translate.get_po_paths, '_uk_ui_translations', False):
        return
    odoo_translate.get_po_paths = get_po_paths
    from odoo.addons.base.models import ir_module  # noqa: PLC0415
    ir_module.get_po_paths = get_po_paths
    try:
        from odoo.addons.mail.models import template_reset_mixin  # noqa: PLC0415
        template_reset_mixin.get_po_paths = get_po_paths
    except ImportError:
        pass
    _logger.info('uk_ui_translations: supplementary Ukrainian translations enabled')


def _reset_code_translations():
    code_translations.python_translations.clear()
    code_translations.web_translations.clear()


_patch_po_paths()
_reset_code_translations()


def post_init_hook(env):
    """Load the database terms (views, menus, fields...) of the covered modules."""
    langs = [code for code, _name in env['res.lang'].get_installed() if code.split('_')[0] == 'uk']
    if not langs:
        _logger.info('uk_ui_translations: Ukrainian is not installed, nothing to load now')
        return
    installed = set(env['ir.module.module'].search([('state', '=', 'installed')]).mapped('name'))
    modules = sorted(name for name in os.listdir(EXTRA_DIR) if name in installed)
    env['ir.module.module']._load_module_terms(modules, langs, overwrite=False)
    _reset_code_translations()
    env.registry.clear_cache()
    _logger.info('uk_ui_translations: loaded terms of %d modules for %s', len(modules), ', '.join(langs))
