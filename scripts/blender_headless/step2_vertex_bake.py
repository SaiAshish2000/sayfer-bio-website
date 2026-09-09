"""
Step 2 (revised): the runtime mesh is too topologically fragmented (172k
triangles, many tiny disconnected clusters from the porous surface) for a UV
atlas to hold meaningful per-texel detail -- median UV-space triangle area
measured well under 1 texel even at 2048x2048. Baking to VERTEX COLORS
instead sidesteps UV packing entirely: every vertex gets an exact value
regardless of topology.

Bakes:
  - Base color (self-bake, DIFFUSE/COLOR pass -- the procedural Scaffold_Zein
    graph is Object-space so this is valid at any poly density) -> vertex colors
  - AO (selected-to-active, HP -> LP, real occlusion from the ~1.56M-tri
    approved R3 source) -> vertex colors
Then multiplies basecolor * AO per loop into one final COLOR_0 attribute,
matching how the final web material will just multiply vertexColors into its
base color (same technique as the original, just with real per-vertex data
baked from the high-poly source instead of a coarse approximation).
"""
import bpy
import mathutils

WORK_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"

bpy.ops.wm.open_mainfile(filepath=WORK_PATH)
scene = bpy.context.scene

lp = bpy.data.objects["Scaffold_LP"]
hp = bpy.data.objects["Scaffold_HP_bake"]
zein = bpy.data.materials["Scaffold_Zein"]

scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 64
scene.world.light_settings.distance = 0.006
scene.world.light_settings.ao_factor = 1.0
scene.render.bake.target = "VERTEX_COLORS"

# ---- clean any previous attempt ----
for name in ("basecolor_vc", "ao_vc", "final_vc"):
    attr = lp.data.color_attributes.get(name)
    if attr:
        lp.data.color_attributes.remove(attr)
old_bake_mat = bpy.data.materials.get("Scaffold_LP_ProcBake")
if old_bake_mat:
    bpy.data.materials.remove(old_bake_mat, do_unlink=True)

bake_mat = zein.copy()
bake_mat.name = "Scaffold_LP_ProcBake"
lp.data.materials.clear()
lp.data.materials.append(bake_mat)


def select_only(objs, active):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active


# ---- 1. self-bake base color to vertex colors (object-space, poly-density independent) ----
basecolor_attr = lp.data.color_attributes.new(name="basecolor_vc", type="FLOAT_COLOR", domain="CORNER")
lp.data.attributes.active_color = basecolor_attr
select_only([lp], lp)
scene.render.bake.use_selected_to_active = False
print("Baking base color to vertex colors (self)...")
bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"})
print("done basecolor")

# ---- 2. selected-to-active bake AO to vertex colors (HP -> LP) ----
ao_attr = lp.data.color_attributes.new(name="ao_vc", type="FLOAT_COLOR", domain="CORNER")
lp.data.attributes.active_color = ao_attr
select_only([hp, lp], lp)
scene.render.bake.use_selected_to_active = True
scene.render.bake.max_ray_distance = 0.0025
scene.render.bake.cage_extrusion = 0.0015
scene.render.bake.use_cage = False
print("Baking AO to vertex colors (selected-to-active, HP->LP)...")
bpy.ops.object.bake(type="AO")
print("done ao")

# ---- 3. combine: final = basecolor * AO, per loop ----
final_attr = lp.data.color_attributes.new(name="final_vc", type="FLOAT_COLOR", domain="CORNER")
n = len(basecolor_attr.data)
assert n == len(ao_attr.data) == len(final_attr.data)
ao_vals = []
for i in range(n):
    bc = basecolor_attr.data[i].color
    ao = ao_attr.data[i].color
    ao_val = ao[0]
    ao_vals.append(ao_val)
    final_attr.data[i].color = (bc[0] * ao_val, bc[1] * ao_val, bc[2] * ao_val, 1.0)

ao_vals.sort()
print(f"AO value distribution: min={ao_vals[0]:.3f} p10={ao_vals[n//10]:.3f} median={ao_vals[n//2]:.3f} p90={ao_vals[9*n//10]:.3f} max={ao_vals[-1]:.3f}")

lp.data.attributes.active_color = final_attr
lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")

# drop the intermediate UV layer too -- not needed by the final export/material
while lp.data.uv_layers:
    lp.data.uv_layers.remove(lp.data.uv_layers[0])

bpy.ops.wm.save_as_mainfile(filepath=WORK_PATH)
print("SAVED", WORK_PATH)
print("DONE_STEP2_VC")
